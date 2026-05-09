/**
 * Side-channel в `sessionStorage` для сохранения значений ReservationForm
 * перед OAuth-редиректом (full-page navigation уничтожает React-tree).
 */
export type ReservationOAuthResume = {
  /** Значения формы бронирования на момент клика по OAuth-провайдеру. */
  values: Record<string, string>;
  /** Pathname + search страницы, с которой стартовал OAuth, для возврата. */
  returnTo: string;
};

const STORAGE_KEY = 'reservation-oauth-resume';

/**
 * Сохраняет состояние формы перед OAuth-редиректом.
 *
 * @param   {ReservationOAuthResume} next - Снэпшот для восстановления.
 * @returns {void}
 */
export const setPendingReservationResume = (next: ReservationOAuthResume): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage может быть недоступен (private mode / квота) — тихо пропускаем,
    // потеря resume — не критично, OAuth всё равно отработает.
  }
};

/**
 * Читает pending-resume без удаления — нужно в callback-странице, чтобы понять,
 * куда возвращаться, не «сжигая» снэпшот: его потребит сам попап.
 *
 * @returns {ReservationOAuthResume | null} Снэпшот или null.
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
 * Читает и удаляет pending-resume (одноразово).
 *
 * @returns {ReservationOAuthResume | null} Снэпшот или null.
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
 * Удаляет pending-resume — например, когда OAuth-редирект сорвался до
 * `window.location.href` (нет client-id, no-op fallback на email-форму).
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
