import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';

import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';

// Only terminal statuses count as "history": actually delivered, or actually cancelled/rejected.
// `isCompleted === true` and the generic `completed` identifier are NOT used — they can be set by
// the admin panel for orders that were never delivered, which would otherwise leak into "Orders History".
export const HISTORY_STATUSES = new Set(['delivered', 'canceled', 'cancelled', 'rejected']);

/**
 * statusLabel — human-readable order status (localized from CMS, otherwise derived from the identifier).
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

/**
 * isHistoryOrder — whether the order belongs to "Orders History" (delivered / cancelled / rejected), not "Active".
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `true` when the order is in a terminal status.
 */
export const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  return HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase());
};

/**
 * computeTotals — subtotal / delivery / discount / total for an order.
 *
 * `discount` = (subtotal + delivery) − serverTotal: if a coupon was applied, `totalSum` already includes the discount.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `{ subtotal, delivery, discount, total }` numbers.
 */
export const computeTotals = (
  o: IOrderByMarkerEntity
): { subtotal: number; delivery: number; discount: number; total: number } => {
  let subtotal = 0;
  let delivery = 0;
  for (const p of o.products) {
    const line = Number(p.price) * Number(p.quantity);
    if (p.id === DELIVERY_PRODUCT_ID) delivery += line;
    else subtotal += line;
  }
  const serverTotal = Number(o.totalSum);
  const total = serverTotal || subtotal + delivery;
  const discount = serverTotal > 0 ? Math.max(0, subtotal + delivery - serverTotal) : 0;
  return { subtotal, delivery, discount, total };
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
