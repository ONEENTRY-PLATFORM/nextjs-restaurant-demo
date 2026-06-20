/**
 * formatScheduleAt — formats a `yyyy-MM-dd` + `HH.MM` pair as `DD.MM.YY HH.MM`.
 *
 * @param   {string} dateIso - Date in `yyyy-MM-dd`.
 * @param   {string} time    - Time in `HH.MM`.
 * @returns Formatted display string (empty when inputs are missing).
 */
export const formatScheduleAt = (dateIso: string, time: string): string => {
  const [yyyy, mm, dd] = dateIso.split('-');
  if (!yyyy || !mm || !dd || !time) return '';
  return `${dd}.${mm}.${yyyy.slice(2)} ${time}`;
};

/**
 * parseScheduleAt — parses a `DD.MM.YY HH.MM` string back into `{ date, time }`.
 *
 * @param   {string} raw - Input string.
 * @returns `{ date, time }` (`{ '', '' }` on parse failure).
 */
export const parseScheduleAt = (raw: string): { date: string; time: string } => {
  const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}\.\d{2})$/);
  if (!m) return { date: '', time: '' };
  const [, dd, mm, yy, time] = m;
  return { date: `20${yy}-${mm}-${dd}`, time: time! };
};
