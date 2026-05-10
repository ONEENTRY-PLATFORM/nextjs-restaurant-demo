/**
 * formatDate — formats an ISO / ms date as `dd.MM.yy` (the "order pill" format
 * used in `static-html/index_rewiews.html` and `pk_active_orders.html`).
 *
 * @param   {string | number | Date | undefined} when - Input date value (string, ms timestamp, `Date`, or `undefined`).
 * @returns Formatted `dd.MM.yy` label, or an empty string when the input is invalid/missing.
 */
export const formatDate = (when: string | number | Date | undefined): string => {
  if (!when) return '';
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
};
