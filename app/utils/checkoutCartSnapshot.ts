'use client';

/** Cart entry shape persisted in the pre-redirect snapshot (mirrors `ProductCartEntry` of CartSlice). */
export type CheckoutCartSnapshotEntry = {
  id: number;
  quantity: number;
  selected: boolean;
};

type CheckoutCartSnapshot = {
  orderId: number;
  savedAt: number;
  items: CheckoutCartSnapshotEntry[];
};

const STORAGE_KEY = 'checkout-cart-snapshot';

/** Snapshots older than this are treated as stale and dropped instead of restored. */
const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * saveCheckoutCartSnapshot — persists the cart entries about to be wiped before an external checkout redirect.
 *
 * Written right before `clearCheckoutState()` on the online-payment path of
 * [useCreateOrder]; consumed by `takeCheckoutCartSnapshot` on `/payment/cancel`
 * or discarded by `clearCheckoutCartSnapshot` on `/payment/success`.
 *
 * @param   {CheckoutCartSnapshotEntry[]} items   - Cart entries (`{ id, quantity, selected }`) to snapshot.
 * @param   {number}                      orderId - Order id the redirect belongs to (diagnostic tag).
 * @returns Nothing — silently no-ops on SSR or storage errors.
 */
export const saveCheckoutCartSnapshot = (
  items: CheckoutCartSnapshotEntry[],
  orderId: number
): void => {
  if (typeof window === 'undefined' || items.length === 0) return;
  try {
    const snapshot: CheckoutCartSnapshot = { orderId, savedAt: Date.now(), items };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full/blocked — recovery is best-effort, checkout must not fail.
  }
};

/**
 * takeCheckoutCartSnapshot — reads and removes the pre-redirect cart snapshot.
 *
 * The snapshot is deleted on read regardless of validity, so a single cancel
 * consumes it and a later unrelated visit cannot restore it twice. Stale
 * (older than the TTL) or malformed payloads return `null`.
 *
 * @returns Snapshot entries to restore, or `null` when absent/stale/invalid.
 */
export const takeCheckoutCartSnapshot = (): CheckoutCartSnapshotEntry[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw) as Partial<CheckoutCartSnapshot>;
    if (!Array.isArray(parsed.items) || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > SNAPSHOT_TTL_MS) return null;

    const items = parsed.items.filter(
      (entry): entry is CheckoutCartSnapshotEntry =>
        !!entry && typeof entry.id === 'number' && typeof entry.quantity === 'number'
    );
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
};

/**
 * clearCheckoutCartSnapshot — drops the pre-redirect cart snapshot without restoring it.
 *
 * @returns Nothing — silently no-ops on SSR or storage errors.
 */
export const clearCheckoutCartSnapshot = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — nothing to recover from.
  }
};
