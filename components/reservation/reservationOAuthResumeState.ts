/**
 * Side-channel для сохранения значений {@link ReservationForm} перед
 * OAuth-редиректом (Google и прочие провайдеры). Браузер делает full-page
 * navigation — React-tree уничтожается, локальный `useState` теряет
 * введённые данные. Через `sessionStorage` они переживают редирект и
 * подхватываются обратно при автоматическом ре-открытии попапа из
 * {@link GoogleAuthCallbackInner} после возврата с OAuth.
 *
 * `sessionStorage`, а не `localStorage`, чтобы данные жили только в рамках
 * одной табы и сами очищались при её закрытии — это совпадает с
 * жизненным циклом OAuth-флоу. Same-origin, поэтому Google-редирект
 * сохраняет тот же storage.
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
 * Читает pending-resume без удаления — нужно в callback-странице, чтобы
 * понять, куда возвращаться, не «сжигая» снэпшот: его потребит сам попап.
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
 * Читает и удаляет pending-resume (одноразово). Вызывает
 * {@link ReservationPopup} при открытии — если есть данные, попап
 * рендерится с восстановленными значениями полей.
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
 * Удаляет pending-resume — например, когда OAuth-редирект сорвался ещё до
 * `window.location.href` (нет client-id, no-op fallback на email-форму).
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
