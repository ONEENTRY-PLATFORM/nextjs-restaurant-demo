import { ASAP_INTERVAL_MIN, type DeliveryMode } from './constants';

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

/**
 * buildDeliveryTimeInterval — value of `delivery_time` (type `timeInterval`) as `[[startISO, endISO]]`.
 *
 * @param   {DeliveryMode} mode         - Delivery mode (`asap` | `scheduled`).
 * @param   {string}       scheduledRaw - Raw `DD.MM.YY HH.MM` schedule string when `mode === 'scheduled'`.
 * @returns `[[startISO, endISO]]` interval, or `null` when the input cannot be parsed.
 */
export const buildDeliveryTimeInterval = (
  mode: DeliveryMode,
  scheduledRaw: string
): [[string, string]] | null => {
  if (mode === 'asap') {
    const start = new Date();
    const end = new Date(start.getTime() + ASAP_INTERVAL_MIN * 60 * 1000);
    return [[start.toISOString(), end.toISOString()]];
  }
  const m = scheduledRaw.match(/^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yy, hh, min] = m;
  const start = new Date(
    Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  );
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return [[start.toISOString(), end.toISOString()]];
};
