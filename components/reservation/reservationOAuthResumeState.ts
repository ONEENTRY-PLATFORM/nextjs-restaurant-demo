/**
 * `sessionStorage`-backed side channel for persisting ReservationForm values
 * before an OAuth redirect (full-page navigation tears down the React tree).
 */
export type ReservationOAuthResume = {
  /** Booking form values at the moment the user clicked the OAuth provider. */
  values: Record<string, string>;
  /** Pathname + search of the page that started OAuth, used to return. */
  returnTo: string;
};

const STORAGE_KEY = 'reservation-oauth-resume';

/**
 * Persists the form state before the OAuth redirect.
 *
 * @param   {ReservationOAuthResume} next - Snapshot to restore later.
 * @returns {void}
 */
export const setPendingReservationResume = (next: ReservationOAuthResume): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage may be unavailable (private mode / quota) — silently skip;
    // losing the resume snapshot is not critical, OAuth still works.
  }
};

/**
 * Reads the pending resume without removing it — used by the callback page to
 * know where to return without consuming the snapshot: the popup will consume it itself.
 *
 * @returns {ReservationOAuthResume | null} Snapshot or null.
 */
export const peekPendingReservationResume = (): ReservationOAuthResume | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReservationOAuthResume) : null;
  } catch {
    return null;
  }
};

/**
 * Reads and removes the pending resume (one-shot).
 *
 * @returns {ReservationOAuthResume | null} Snapshot or null.
 */
export const consumePendingReservationResume = (): ReservationOAuthResume | null => {
  const value = peekPendingReservationResume();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
  return value;
};

/**
 * Removes the pending resume — e.g. when the OAuth redirect aborted before
 * `window.location.href` (no client-id, no-op fallback to the email form).
 *
 * @returns {void}
 */
export const clearPendingReservationResume = (): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
};
