/** Cart entry shape read from Redux (`CartSlice.productsData`). */
type CartEntry = { id: number; quantity: number };

/**
 * cartToServerCartItems — maps Redux cart entries to the `Users.setCart` body items.
 *
 * Drops zero/negative-quantity entries (treated as "not in cart").
 *
 * @param   {CartEntry[]} productsData - Redux cart entries.
 * @returns `[{ productId, qty }]` for `Users.setCart`.
 */
export const cartToServerCartItems = (
  productsData: CartEntry[]
): Array<{ productId: number; qty: number }> =>
  productsData.filter(p => p.quantity > 0).map(p => ({ productId: p.id, qty: p.quantity }));

/**
 * favoritesToWishlistItems — maps favorite product ids to the `Users.setWishlist` body items.
 *
 * @param   {number[]} favorites - Favorite product ids.
 * @returns `[{ productId }]` for `Users.setWishlist`.
 */
export const favoritesToWishlistItems = (favorites: number[]): Array<{ productId: number }> =>
  favorites.map(productId => ({ productId }));

/**
 * cartContentKey — order-independent content key so the mirror fires only on real cart changes.
 *
 * @param   {CartEntry[]} productsData - Redux cart entries.
 * @returns `id:qty` pairs (positive quantity only), sorted and joined.
 */
export const cartContentKey = (productsData: CartEntry[]): string =>
  productsData
    .filter(p => p.quantity > 0)
    .map(p => `${p.id}:${p.quantity}`)
    .sort()
    .join(',');

/**
 * favoritesKey — order-independent content key for the favorites list.
 *
 * @param   {number[]} favorites - Favorite product ids.
 * @returns Sorted, joined ids.
 */
export const favoritesKey = (favorites: number[]): string =>
  [...favorites].sort((a, b) => a - b).join(',');

/** A single item of the server cart (`Users.getCart().items`). */
type ServerCartItem = { productId: number; qty: number };
/** A single item of the server wishlist (`Users.getWishlist().items`). */
type ServerWishlistItem = { productId: number };

/**
 * planCartMerge — computes the Redux dispatches that union a server cart into the local cart on login.
 *
 * Non-destructive: a product only on the server is added with the server quantity; a product in both
 * is bumped up to the larger of the two quantities (so neither device shrinks the other); a product
 * the local cart already holds with an equal-or-greater quantity is left untouched. The caller turns
 * `toAdd` into `addProductToCart` and `toBump` into `setProductQty` dispatches.
 *
 * @param   {CartEntry[]}      local  - Local Redux cart entries.
 * @param   {ServerCartItem[]} server - Server cart items.
 * @returns `{ toAdd, toBump }` — server-only items to add and shared items to raise to the server qty.
 */
export const planCartMerge = (
  local: CartEntry[],
  server: ServerCartItem[]
): {
  toAdd: Array<{ id: number; quantity: number }>;
  toBump: Array<{ id: number; quantity: number }>;
} => {
  const localQtyById = new Map(local.map(entry => [entry.id, entry.quantity]));
  const toAdd: Array<{ id: number; quantity: number }> = [];
  const toBump: Array<{ id: number; quantity: number }> = [];
  for (const item of server) {
    if (item.qty <= 0) continue;
    const localQty = localQtyById.get(item.productId);
    if (localQty === undefined) {
      toAdd.push({ id: item.productId, quantity: item.qty });
    } else if (item.qty > localQty) {
      toBump.push({ id: item.productId, quantity: item.qty });
    }
  }
  return { toAdd, toBump };
};

/**
 * planWishlistMerge — server wishlist ids that the local favorites do not already contain.
 *
 * @param   {number[]}             localFavorites - Local favorite product ids.
 * @param   {ServerWishlistItem[]} server         - Server wishlist items.
 * @returns Product ids to add to local favorites (`addFavorites`).
 */
export const planWishlistMerge = (
  localFavorites: number[],
  server: ServerWishlistItem[]
): number[] => {
  const have = new Set(localFavorites);
  return server.filter(item => !have.has(item.productId)).map(item => item.productId);
};
