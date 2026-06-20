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
export const favoritesToWishlistItems = (
  favorites: number[]
): Array<{ productId: number }> => favorites.map(productId => ({ productId }));

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
