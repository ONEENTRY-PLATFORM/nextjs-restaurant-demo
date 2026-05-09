/**
 * Product cards per catalog page limit.
 * Applies on `/shop`, `/shop/category/[handle]`, `/shop/[handle]`.
 * Read from `NEXT_PUBLIC_SHOP_PAGE_LIMIT` (.env / .env.local), defaults to 10.
 */
export const SHOP_PAGE_LIMIT: number = Number(process.env.NEXT_PUBLIC_SHOP_PAGE_LIMIT) || 10;

/**
 * Id of the OneEntry product representing delivery.
 *
 * Used as a separate row in the cart totals (Delivery: $X), hidden from the
 * visual product list, and appended to `orderProducts` when creating an order
 * (see `useCreateOrder`). Read from `NEXT_PUBLIC_DELIVERY_PRODUCT_ID`,
 * defaults to 33 — matches the "Delivery" product in the OneEntry catalog.
 */
export const DELIVERY_PRODUCT_ID: number =
  Number(process.env.NEXT_PUBLIC_DELIVERY_PRODUCT_ID) || 33;
