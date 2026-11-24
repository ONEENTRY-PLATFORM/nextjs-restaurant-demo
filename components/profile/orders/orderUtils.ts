import type { IOrderByMarkerEntity, IOrderProducts, IProductsEntity } from 'oneentry/types';

import { DELIVERY_PRODUCT_ID, ORDER_HISTORY_STATUSES } from '@/app/utils/constants';

// Only terminal statuses count as "history": actually delivered, or actually cancelled/rejected.
// `isCompleted === true` and the generic `completed` identifier are NOT used — they can be set by
// the admin panel for orders that were never delivered, which would otherwise leak into "Orders History".
export const HISTORY_STATUSES = new Set<string>(ORDER_HISTORY_STATUSES);

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

/**
 * orderProductPreview — preview image URL of an order line item.
 *
 * `previewImage` arrives as one picture, an array of pictures (`[]` when the product has no
 * preview) or `null`; the first picture of an array is used.
 *
 * The SDK types `previewLink` as a string, but the API sends an object of named previews —
 * `{ preview: ['data:image/webp;base64,…', 'https://…/x.preview.preview.jpeg'] }` — so the first
 * `http(s)` URL inside it is taken. Anything else yields `undefined`, and the caller falls back
 * to the catalogue image.
 *
 * @param   {IOrderProducts} p - Order line item.
 * @returns Preview URL, or `undefined` when the line item carries none.
 */
export const orderProductPreview = (p: IOrderProducts): string | undefined => {
  const img = Array.isArray(p.previewImage) ? p.previewImage[0] : p.previewImage;
  const link: unknown = img?.previewLink;
  if (typeof link === 'string') return link || undefined;
  if (link && typeof link === 'object') {
    for (const variants of Object.values(link)) {
      const list: unknown[] = Array.isArray(variants) ? variants : [variants];
      const url = list.find((v): v is string => typeof v === 'string' && /^https?:\/\//.test(v));
      if (url) return url;
    }
  }
  return undefined;
};

/**
 * orderProductTitle — display title of an order line item.
 *
 * `title` is `null` when the product has no translation in the order's language; then the
 * full product's title is used, and an empty string as the last resort.
 *
 * @param   {IOrderProducts}              p             - Order line item.
 * @param   {IProductsEntity | undefined} [fullProduct] - Full product entity, when loaded.
 * @returns Title to show.
 */
export const orderProductTitle = (p: IOrderProducts, fullProduct?: IProductsEntity): string =>
  p.title ?? fullProduct?.localizeInfos?.title ?? '';
