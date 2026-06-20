import { describe, expect, it } from '@jest/globals';

import {
  cartContentKey,
  cartToServerCartItems,
  favoritesKey,
  favoritesToWishlistItems,
} from '../serverCartSync.utils';

describe('cartToServerCartItems', () => {
  it('maps positive-quantity entries to { productId, qty } and drops empties', () => {
    const items = cartToServerCartItems([
      { id: 1, quantity: 2 },
      { id: 2, quantity: 0 },
      { id: 3, quantity: 1 },
    ]);
    expect(items).toEqual([
      { productId: 1, qty: 2 },
      { productId: 3, qty: 1 },
    ]);
  });
});

describe('favoritesToWishlistItems', () => {
  it('maps ids to { productId }', () => {
    expect(favoritesToWishlistItems([5, 9])).toEqual([{ productId: 5 }, { productId: 9 }]);
  });
});

describe('cartContentKey', () => {
  it('is order-independent and ignores zero-quantity entries', () => {
    const a = cartContentKey([
      { id: 2, quantity: 1 },
      { id: 1, quantity: 3 },
      { id: 9, quantity: 0 },
    ]);
    const b = cartContentKey([
      { id: 1, quantity: 3 },
      { id: 2, quantity: 1 },
    ]);
    expect(a).toBe(b);
  });

  it('changes when a quantity changes', () => {
    expect(cartContentKey([{ id: 1, quantity: 1 }])).not.toBe(
      cartContentKey([{ id: 1, quantity: 2 }])
    );
  });
});

describe('favoritesKey', () => {
  it('is order-independent', () => {
    expect(favoritesKey([3, 1, 2])).toBe(favoritesKey([1, 2, 3]));
  });
});
