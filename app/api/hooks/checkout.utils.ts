import type { IAccountsEntity, IOrderPreviewResponse } from 'oneentry/types';

/** Server-authoritative order totals derived from `Orders.previewOrder`. */
export type ServerOrderTotals = {
  /** Sum of item lines (excludes the delivery line). */
  subtotal: number;
  /** Delivery line total. */
  delivery: number;
  /** Discount = `totalSum − totalSumWithDiscount` (server-side coupons/auto-discounts). */
  discount: number;
  /** Amount due after discounts and bonuses (`totalDue`). */
  total: number;
  /** Bonuses applied by the server. */
  bonusApplied: number;
  /** Order currency reported by the server. */
  currency?: string;
};

/**
 * filterAllowedAccounts — payment accounts to offer for the delivery checkout.
 *
 * Keeps only visible/used accounts, then intersects with the storage's linked payment identifiers;
 * when the storage links none, all visible accounts are returned (per the orders rule).
 *
 * @param   {IAccountsEntity[]} [accounts]           - All payment accounts from `Payments.getAccounts`.
 * @param   {Set<string>}       [allowedIdentifiers] - `storage.paymentAccountIdentifiers` markers.
 * @returns Payment accounts to render.
 */
export const filterAllowedAccounts = (
  accounts?: IAccountsEntity[],
  allowedIdentifiers?: Set<string>
): IAccountsEntity[] => {
  const visible = (accounts ?? []).filter(a => a.isVisible !== false && a.isUsed !== false);
  if (!allowedIdentifiers || allowedIdentifiers.size === 0) return visible;
  return visible.filter(a => allowedIdentifiers.has(a.identifier));
};

/**
 * derivePreviewTotals — maps an `Orders.previewOrder` response to the checkout summary totals.
 *
 * Splits the line items into subtotal vs delivery, and surfaces the server-side discount and the
 * amount due after bonuses — so server discounts/bonuses/taxes are reflected before order creation.
 *
 * @param   {IOrderPreviewResponse} preview          - `previewOrder` response.
 * @param   {number}                deliveryProductId - Id of the virtual delivery product.
 * @returns Derived {@link ServerOrderTotals}.
 */
export const derivePreviewTotals = (
  preview: IOrderPreviewResponse,
  deliveryProductId: number
): ServerOrderTotals => {
  const items = Array.isArray(preview.orderPreview) ? preview.orderPreview : [];
  const subtotal = items
    .filter(i => i.id !== deliveryProductId)
    .reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const delivery = items
    .filter(i => i.id === deliveryProductId)
    .reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  return {
    subtotal,
    delivery,
    discount: Math.max(0, preview.totalSum - preview.totalSumWithDiscount),
    total: preview.totalDue ?? preview.totalSumWithDiscount,
    bonusApplied: preview.bonusApplied ?? 0,
    currency: preview.currency,
  };
};
