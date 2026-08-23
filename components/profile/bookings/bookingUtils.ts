import type { IOrderByMarkerEntity, IOrdersFormData } from 'oneentry/types';

import { BOOKING_HISTORY_STATUSES, ORDER_HISTORY_STATUSES } from '@/app/utils/constants';
import { formatDate } from '@/app/utils/formatDate';
import { TIME_SLOT_MARKER } from '@/components/reservation/reservationFormUtils';

export const HISTORY_STATUSES = new Set<string>([
  ...ORDER_HISTORY_STATUSES,
  ...BOOKING_HISTORY_STATUSES,
]);

/**
 * parseDateLoose — extracts a `Date` from heterogeneous OneEntry value shapes.
 *
 * @param   {unknown} raw - Value from `IOrdersFormData.value`.
 * @returns Parsed `Date` or `null` when the input cannot be interpreted.
 */
export const parseDateLoose = (raw: unknown): Date | null => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const d = parseDateLoose(item);
      if (d) return d;
    }
    return null;
  }
  if (typeof raw === 'object') {
    const obj = raw as { fullDate?: unknown; from?: unknown; value?: unknown };
    return (
      parseDateLoose(obj.fullDate) ?? parseDateLoose(obj.from) ?? parseDateLoose(obj.value) ?? null
    );
  }
  return null;
};

/**
 * getBookingDate — reservation moment extracted from the order's `formData`.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `Date` of the booking, or `null` when no date field is present.
 */
export const getBookingDate = (o: IOrderByMarkerEntity): Date | null => {
  const fields = (o.formData as IOrdersFormData[] | undefined) ?? [];
  const slot = fields.find(f => f.marker === TIME_SLOT_MARKER);
  if (slot) {
    const d = parseDateLoose(slot.value);
    if (d) return d;
  }
  const byType = fields.find(f => f.type === 'timeInterval' || f.type === 'date');
  if (byType) {
    const d = parseDateLoose(byType.value);
    if (d) return d;
  }
  return null;
};

/**
 * isHistoryOrder — whether the booking order is in history (completed / terminal status / past reservation date).
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `true` when the booking belongs to history.
 */
export const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  if (HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase())) return true;
  const bookingDate = getBookingDate(o);
  if (bookingDate && bookingDate.getTime() < Date.now()) return true;
  return false;
};

/**
 * formatOrderNumber — order number `OE…` from the SDK, otherwise fallback to the numeric id.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Display order number string.
 */
export const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

/**
 * formatBookingWhen — actual reservation moment as `DD.MM.YY HH:MM` (from `time_slot`), with a
 * fallback to the order's creation date when no slot is set.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Formatted date + time string, empty when neither source is parseable.
 */
export const formatBookingWhen = (o: IOrderByMarkerEntity): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const bookingDate = getBookingDate(o);
  if (bookingDate) {
    const dateStr = `${pad(bookingDate.getUTCDate())}.${pad(bookingDate.getUTCMonth() + 1)}.${String(bookingDate.getUTCFullYear()).slice(2)}`;
    const timeStr = `${pad(bookingDate.getUTCHours())}:${pad(bookingDate.getUTCMinutes())}`;
    return `${dateStr} ${timeStr}`;
  }
  const dateRaw = (o.createdDate ??
    (o as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  return dateRaw ? formatDate(dateRaw) : '';
};

/**
 * statusLabel — human-readable booking status (localized from CMS, otherwise derived from the identifier).
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Localized status title or a humanised identifier (`-` when nothing is set).
 */
export const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (o.statusLocalizeInfos as { title?: string } | undefined)?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '-';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
};
