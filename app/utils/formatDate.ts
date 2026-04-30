/**
 * Форматирует ISO / ms-дату как `dd.MM.yy` (формат «пилюли заказа» в
 * `static-html/index_rewiews.html` и `pk_active_orders.html`).
 * @param   {string | number | Date | undefined} when - Входное значение даты.
 * @returns {string}                                    Отформатированная метка или пустая строка.
 */
export const formatDate = (
  when: string | number | Date | undefined,
): string => {
  if (!when) return '';
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(
    d.getFullYear(),
  ).slice(2)}`;
};
