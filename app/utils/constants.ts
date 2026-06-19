/** Product cards per catalog page limit. */
export const SHOP_PAGE_LIMIT = 8;

/** Id of the OneEntry product representing delivery. */
export const DELIVERY_PRODUCT_ID = 1828;

/** Id of the OneEntry product representing booking. */
export const BOOKING_PRODUCT_ID = 2071;

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

/**
 * OneEntry product attribute markers — the `dish` attribute set schema.
 *
 * Single source of truth for product markers. Used both as keys into a product's `attributeValues`
 * map (e.g. `attributeValues[PRODUCT_ATTRS.weight]?.value`) and as the `attributeMarker` passed to
 * `getSingleAttributeByMarkerSet` / product `IFilterParams` (search, preferences, filter, price range).
 * Keep in sync with the `dish` attribute set in the OneEntry admin panel.
 */
export const PRODUCT_ATTRS = {
  dishName: 'dish_name',
  category: 'category',
  description: 'description',
  images: 'images',
  morePic: 'more_pic',
  sku: 'sku',
  price: 'price',
  currency: 'currency',
  sale: 'sale',
  weight: 'weight',
  calories: 'calories',
  cookingTime: 'cooking_time',
  ingredients: 'ingredients',
  preferences: 'preferences',
  filter: 'filter',
} as const;

/** OneEntry non-product attribute markers — `attributeMarker` field on attribute requests. */
export const ATTRS = {
  staticContent: 'static_content',
} as const;

/** OneEntry content-filter markers — used by `Filters.getFilterByMarker` (curated grouped filter trees). */
export const CONTENT_FILTERS = {
  dishes: 'dishes',
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
  cartComplement: 'cart_complement',
  recentlyViewed: 'recently_viewed',
  trending: 'trending',
  personalRecommendations: 'personal_recommendations',
} as const;

/**
 * OneEntry product-status markers (`product.statusIdentifier`).
 *
 * ⚠️ Single source of truth — replaces scattered string literals. These cannot
 * yet be fetched/verified dynamically: the Guests group lacks read permission on
 * ProductStatuses (`403 "Permission data not found"`), see ONEENTRY-ADMIN-TODO.
 * Keep in sync with the admin panel until that permission is granted.
 */
export const PRODUCT_STATUSES = {
  outOfStock: 'out_of_stock',
} as const;

/**
 * OneEntry order-status markers (`order.statusIdentifier`).
 *
 * ⚠️ Order statuses require user auth to read, so they cannot be verified
 * anonymously — confirm against the admin panel (see ONEENTRY-ADMIN-TODO).
 * `canceled`/`cancelled` are both kept because the marker spelling is unverified.
 */
export const ORDER_STATUSES = {
  delivered: 'delivered',
  canceled: 'canceled',
  cancelled: 'cancelled',
  rejected: 'rejected',
  bookingCancelled: 'booking_cancelled',
} as const;

/** Order statuses that move an order into the "history" tab (`isHistoryOrder`). */
export const ORDER_HISTORY_STATUSES = [
  ORDER_STATUSES.delivered,
  ORDER_STATUSES.canceled,
  ORDER_STATUSES.cancelled,
  ORDER_STATUSES.rejected,
] as const;
