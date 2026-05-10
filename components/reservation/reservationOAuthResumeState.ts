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
 * setPendingReservationResume — persists the form state before the OAuth redirect.
 *
 * @param   {ReservationOAuthResume} next - Snapshot to restore after the redirect.
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
 * peekPendingReservationResume — reads the pending resume without removing it.
 *
 * Used by the callback page to know where to return without consuming the snapshot — the popup consumes it itself.
 *
 * @returns {ReservationOAuthResume | null} Snapshot or `null`.
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
 * consumePendingReservationResume — reads and removes the pending resume (one-shot).
 *
 * @returns {ReservationOAuthResume | null} Snapshot or `null`.
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
 * clearPendingReservationResume — removes the pending resume (e.g. when the OAuth redirect aborts before `window.location.href`).
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
