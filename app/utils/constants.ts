/** Product cards per catalog page limit. */
export const SHOP_PAGE_LIMIT: number = Number(process.env.NEXT_PUBLIC_SHOP_PAGE_LIMIT) || 10;

/** Id of the OneEntry product representing delivery. */
export const DELIVERY_PRODUCT_ID: number =
  Number(process.env.NEXT_PUBLIC_DELIVERY_PRODUCT_ID) || 33;
