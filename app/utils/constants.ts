/** Product cards per catalog page limit. */
export const SHOP_PAGE_LIMIT = 8;

/** Id of the OneEntry product representing delivery. */
export const DELIVERY_PRODUCT_ID = 33;

/**
 * OneEntry page markers (`pageUrl`).
 *
 * Used as arguments to `getPageByUrl` / `getChildPagesByParentUrl` / `getBlocksByPageUrl` / `getProductsByPageUrl`,
 * and to match `page.pageUrl` values returned by Menus API (see navigation dispatchers).
 */
export const PAGES = {
  home: 'home_web',
  support: 'support',
  notFound: '404',
  blog: 'blog',
  restaurants: 'restaurants',
  services: 'services',
  filters: 'filters',
  menu: 'menu',
  profile: 'profile',
  cart: 'cart',
  favorites: 'favorites',
  bookings: 'bookings',
} as const;

/** OneEntry menu markers — used by `getMenuByMarker`. */
export const MENUS = {
  bottomWeb: 'bottom_web',
  userMenu: 'user_menu',
} as const;

/**
 * OneEntry form markers — used by `getFormByMarker` / `postFormsData` (`formIdentifier`).
 *
 * Order entities reuse these same markers via `Orders.getAllOrdersByMarker`,
 * because OneEntry groups orders by the form they were created from.
 */
export const FORMS = {
  contactUs: 'contact_us',
  user: 'user',
  deliveryOrder: 'delivery_order',
  bookingOrder: 'booking_order',
} as const;

/** OneEntry attribute-set markers — first arg of `getSingleAttributeByMarkerSet({ setMarker })`. */
export const ATTR_SETS = {
  dish: 'dish',
  product: 'product',
} as const;

/** OneEntry attribute markers — `attributeMarker` field on attribute and filter requests. */
export const ATTRS = {
  preferences: 'preferences',
  staticContent: 'static_content',
  sku: 'sku',
  price: 'price',
  cookingTime: 'cooking_time',
} as const;

/**
 * OneEntry block identifiers — matched against `block.identifier` returned by `getBlocksByPageUrl`,
 * and passed as marker to `Blocks.getBlockByMarker` / `getBlockProducts`.
 */
export const BLOCKS = {
  homePromo: 'home_promo',
  recommended: 'recommended',
  homeCategories: 'home_categories',
  similarDishes: 'similar_dishes',
} as const;
