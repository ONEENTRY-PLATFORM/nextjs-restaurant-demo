import { describe, expect, it } from '@jest/globals';

import {
  cartContentKey,
  cartToServerCartItems,
  favoritesKey,
  favoritesToWishlistItems,
  planCartMerge,
  planWishlistMerge,
} from '@/app/api/hooks/serverCartSync.utils';

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

describe('planCartMerge', () => {
  it('adds server-only items with the server quantity', () => {
    const { toAdd, toBump } = planCartMerge(
      [{ id: 1, quantity: 2 }],
      [
        { productId: 1, qty: 2 },
        { productId: 5, qty: 3 },
      ]
    );
    expect(toAdd).toEqual([{ id: 5, quantity: 3 }]);
    expect(toBump).toEqual([]);
  });

  it('bumps shared items up to the larger quantity (non-destructive merge)', () => {
    const { toAdd, toBump } = planCartMerge(
      [
        { id: 1, quantity: 1 },
        { id: 2, quantity: 5 },
      ],
      [
        { productId: 1, qty: 4 },
        { productId: 2, qty: 2 },
      ]
    );
    expect(toAdd).toEqual([]);
    // id 1: server 4 > local 1 → bump; id 2: server 2 < local 5 → keep local
    expect(toBump).toEqual([{ id: 1, quantity: 4 }]);
  });

  it('ignores non-positive server quantities', () => {
    const { toAdd, toBump } = planCartMerge([], [{ productId: 9, qty: 0 }]);
    expect(toAdd).toEqual([]);
    expect(toBump).toEqual([]);
  });

  it('pulls the full server cart onto an empty local cart (fresh device)', () => {
    const { toAdd, toBump } = planCartMerge(
      [],
      [
        { productId: 1, qty: 2 },
        { productId: 2, qty: 1 },
      ]
    );
    expect(toAdd).toEqual([
      { id: 1, quantity: 2 },
      { id: 2, quantity: 1 },
    ]);
    expect(toBump).toEqual([]);
  });
});

describe('planWishlistMerge', () => {
  it('returns server ids not already in local favorites', () => {
    expect(
      planWishlistMerge([3, 7], [{ productId: 3 }, { productId: 8 }, { productId: 7 }])
    ).toEqual([8]);
  });

  it('pulls the whole server wishlist onto empty local favorites', () => {
    expect(planWishlistMerge([], [{ productId: 1 }, { productId: 2 }])).toEqual([1, 2]);
  });
});
