import { describe, expect, it } from '@jest/globals';

import cartReducer, {
  addProductToCart,
  decreaseProductQty,
  increaseProductQty,
  removeAllProducts,
  removeProduct,
  setProductQty,
} from '../CartSlice';

/**
 * initial — fresh `cartSlice` state.
 *
 * Letting the reducer initialise the full state (via `@@INIT`) keeps tests
 * resilient to slice growth — adding a new field to `InitialStateType` does
 * not break existing tests.
 *
 * @returns Initial cart-slice state.
 */
const initial = () => cartReducer(undefined, { type: '@@INIT' });

describe('CartSlice — addProductToCart', () => {
  it('adds a new product when the id is not in the cart', () => {
    const state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 2, selected: true }));
    expect(state.productsData).toEqual([{ id: 1, quantity: 2, selected: true }]);
  });

  it('does not duplicate an existing positive-quantity entry', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 2, selected: true }));
    state = cartReducer(state, addProductToCart({ id: 1, quantity: 5, selected: true }));
    expect(state.productsData).toHaveLength(1);
    expect(state.productsData[0]).toEqual({ id: 1, quantity: 2, selected: true });
  });

  it('self-heals a corrupted entry with quantity <= 0 (revives it from the payload)', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 0, selected: true }));
    // Force the entry to quantity=0 the same way persisted corruption would.
    state = { ...state, productsData: [{ id: 1, quantity: 0, selected: true }] };
    state = cartReducer(state, addProductToCart({ id: 1, quantity: 3, selected: true }));
    expect(state.productsData).toEqual([{ id: 1, quantity: 3, selected: true }]);
  });
});

describe('CartSlice — increaseProductQty', () => {
  it('adds payload.quantity to the existing entry', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, increaseProductQty({ id: 1, quantity: 2, units: 0 }));
    expect(state.productsData[0]?.quantity).toBe(3);
  });

  it('caps the result at `units` when set (>0)', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 4, selected: true }));
    state = cartReducer(state, increaseProductQty({ id: 1, quantity: 10, units: 5 }));
    expect(state.productsData[0]?.quantity).toBe(5);
  });

  it('does NOT cap when units is 0 (interpreted as "no upper bound")', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 4, selected: true }));
    state = cartReducer(state, increaseProductQty({ id: 1, quantity: 10, units: 0 }));
    expect(state.productsData[0]?.quantity).toBe(14);
  });

  it('is a noop when the id is not in the cart', () => {
    const state = cartReducer(initial(), increaseProductQty({ id: 999, quantity: 1, units: 0 }));
    expect(state.productsData).toHaveLength(0);
  });
});

describe('CartSlice — decreaseProductQty', () => {
  it('subtracts payload.quantity from the existing entry', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 5, selected: true }));
    state = cartReducer(state, decreaseProductQty({ id: 1, quantity: 2 }));
    expect(state.productsData[0]?.quantity).toBe(3);
  });

  it('clamps to 1 instead of going to 0 or negative (keeps the entry visible)', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, decreaseProductQty({ id: 1, quantity: 5 }));
    expect(state.productsData[0]?.quantity).toBe(1);
  });
});

describe('CartSlice — setProductQty', () => {
  it('sets the quantity directly', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, setProductQty({ id: 1, quantity: 7, units: 0 }));
    expect(state.productsData[0]?.quantity).toBe(7);
  });

  it('caps at `units` when set', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, setProductQty({ id: 1, quantity: 99, units: 10 }));
    expect(state.productsData[0]?.quantity).toBe(10);
  });

  it('removes the entry when quantity <= 0 (prevents the empty-slot UI freeze)', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 3, selected: true }));
    state = cartReducer(state, setProductQty({ id: 1, quantity: 0, units: 0 }));
    expect(state.productsData).toHaveLength(0);
  });
});

describe('CartSlice — removeProduct / removeAllProducts', () => {
  it('removeProduct deletes by id', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, addProductToCart({ id: 2, quantity: 1, selected: true }));
    state = cartReducer(state, removeProduct(1));
    expect(state.productsData.map(p => p.id)).toEqual([2]);
  });

  it('removeAllProducts empties productsData', () => {
    let state = cartReducer(initial(), addProductToCart({ id: 1, quantity: 1, selected: true }));
    state = cartReducer(state, addProductToCart({ id: 2, quantity: 1, selected: true }));
    state = cartReducer(state, removeAllProducts());
    expect(state.productsData).toEqual([]);
  });
});
