import type { IProductsEntity } from 'oneentry/types';

import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';

export const ORDER_ROW_SELECTOR = '.step-order-row';

export type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

/** A selected, in-stock cart line paired with its full product entity. */
export type OrderLineItem = {
  entry: CartEntry;
  product: IProductsEntity;
};

/** Resolved totals shown in the order summary (server preview or client fallback). */
export type OrderTotalsDisplay = {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  bonusApplied: number;
};

/**
 * selectOrderItems — pairs cart entries with their products and keeps only billable lines.
 *
 * Drops unselected items, the out-of-stock product, and the delivery line (shown separately in the
 * totals so it is not double-counted in the subtotal).
 *
 * @param   {CartEntry[]}              cartData         - Cart entries (id + quantity + selected).
 * @param   {IProductsEntity[]}        products         - Full product entities loaded into the cart.
 * @param   {string | null | undefined} outOfStockMarker - Status marker treated as out of stock.
 * @returns Billable order lines (`{ entry, product }`).
 */
export const selectOrderItems = (
  cartData: CartEntry[],
  products: IProductsEntity[],
  outOfStockMarker: string | null | undefined
): OrderLineItem[] =>
  cartData
    .map(entry => ({
      entry,
      product: products.find(p => p.id === entry.id),
    }))
    .filter(
      row =>
        row.product &&
        row.entry.selected &&
        row.product.statusIdentifier !== outOfStockMarker &&
        // Delivery shows as a separate line in the totals - otherwise it gets double-counted in the subtotal.
        row.entry.id !== DELIVERY_PRODUCT_ID
    ) as OrderLineItem[];

/**
 * computeClientTotals — client-side fallback totals when the server preview is unavailable.
 *
 * @param   {OrderLineItem[]} items         - Billable order lines.
 * @param   {{ totalSum: number; totalSumWithDiscount: number } | null | undefined} appliedCoupon - Applied coupon, if any.
 * @param   {number}          deliveryPrice - Delivery price added to the subtotal.
 * @returns Resolved totals with `bonusApplied` fixed at `0` (bonuses are server-only).
 */
export const computeClientTotals = (
  items: OrderLineItem[],
  appliedCoupon: { totalSum: number; totalSumWithDiscount: number } | null | undefined,
  deliveryPrice: number
): OrderTotalsDisplay => {
  const subtotal = items.reduce((sum, { entry, product }) => {
    const price = product.price ?? 0;
    return sum + price * (entry.quantity ?? 1);
  }, 0);
  const discount = appliedCoupon
    ? Math.max(0, appliedCoupon.totalSum - appliedCoupon.totalSumWithDiscount)
    : 0;
  // "To Entire Order" coupon: `totalSumWithDiscount` already includes delivery - do not add it again, otherwise it gets double-counted.
  const total = appliedCoupon ? appliedCoupon.totalSumWithDiscount : subtotal + deliveryPrice;
  return { subtotal, delivery: deliveryPrice, discount, total, bonusApplied: 0 };
};
