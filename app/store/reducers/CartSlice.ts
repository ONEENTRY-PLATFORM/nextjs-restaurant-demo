'use client';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

export type ProductCartEntry = {
  id: number;
  quantity: number;
  selected: boolean;
};

/** Reservation record in the cart slice — a table booking slot for a single restaurant branch. */
type ReservationEntry = {
  id: number;
  restaurant?: IPagesEntity;
  product?: IProductsEntity;
  date?: Date;
  interval?: Date[];
};

type InitialStateType = {
  products: IProductsEntity[];
  productsData: ProductCartEntry[];
  delivery: IProductsEntity | null;
  deliveryData: {
    date: number;
    time: string;
    address: string;
  };
  reservationId: number;
  reservations: ReservationEntry[];
  transitionId: number;
  version: number;
};

const initialState: InitialStateType = {
  products: [],
  productsData: [],
  delivery: {} as IProductsEntity,
  deliveryData: {
    date: new Date().getTime(),
    time: '',
    address: '',
  },
  reservationId: 0,
  reservations: [
    {
      id: 0,
      restaurant: {} as IPagesEntity,
      product: {} as IProductsEntity,
      date: {} as Date,
      interval: [] as Date[],
    },
  ],
  transitionId: 0,
  version: 0,
};

export const cartSlice = createSlice({
  name: 'cart-slice',
  initialState,
  reducers: {
    addReservationToCart(state, action: PayloadAction<ReservationEntry>) {
      if (state.reservations.length < 1) {
        state.reservations.push(action.payload);
      }
      state.reservations = state.reservations.map(entry => {
        if (action.payload.id === entry.id) {
          return {
            ...entry,
            ...action.payload,
          };
        } else {
          return entry;
        }
      });
    },
    addProductToCart(
      state,
      action: PayloadAction<{
        id: number;
        selected: boolean;
        quantity: number;
      }>
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id
      );
      if (index === -1) {
        state.productsData.push(action.payload);
        return;
      }
      // Self-heal: the entry was "orphaned" with quantity<=0 (corrupted
      // persisted copy) — revive it up to payload.quantity (>= 1).
      const entry = state.productsData[index];
      if (entry && entry.quantity <= 0) {
        state.productsData[index] = { ...entry, ...action.payload };
      }
    },
    addProductsToCart(state, action: PayloadAction<IProductsEntity[]>) {
      state.products = action.payload;
    },
    increaseProductQty(
      state,
      action: PayloadAction<{ units: number; id: number; quantity: number }>
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id
      );
      const entry = state.productsData[index];
      if (!entry) return;
      const qty = entry.quantity + action.payload.quantity;

      const cap = action.payload.units;
      state.productsData[index] = {
        ...entry,
        selected: entry.selected,
        quantity: cap && qty > cap ? Number(cap) : qty,
      };
    },
    decreaseProductQty(state, action: PayloadAction<{ id: number; quantity: number }>) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id
      );
      const entry = state.productsData[index];
      if (!entry) return;
      const qty = entry.quantity - action.payload.quantity;
      state.productsData[index] = {
        ...entry,
        selected: entry.selected,
        quantity: qty <= 0 ? 1 : qty,
      };
    },
    setProductQty(state, action: PayloadAction<{ units: number; id: number; quantity: number }>) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id
      );
      const entry = state.productsData[index];
      if (!entry) return;
      const qty = action.payload.quantity;
      const cap = action.payload.units;

      // qty=0 -> delete the entry, otherwise the UI freezes: AddToCartButton
      // sees the product in the cart (via selectIsInCart) and renders
      // QuantitySelector, which returns <></> when quantity=0 — leaving an
      // empty slot without a button.
      if (qty <= 0) {
        state.productsData.splice(index, 1);
        return;
      }

      state.productsData[index] = {
        ...entry,
        selected: entry.selected,
        // Falsy-cap guard: `units = 0` means "no upper bound" (attribute not filled in CMS).
        quantity: cap && qty > cap ? cap : qty,
      };
    },
    removeProduct(state, action: PayloadAction<number>) {
      state.productsData = state.productsData.filter(
        (item: { id: number }) => item.id !== action.payload
      );
    },
    removeAllProducts(state) {
      state.productsData = initialState.productsData;
      state.products = initialState.products;
    },
    restoreCartProducts(state, action: PayloadAction<ProductCartEntry[]>) {
      action.payload.forEach(entry => {
        const index = state.productsData.findIndex(product => product.id === entry.id);
        if (index === -1) {
          state.productsData.push(entry);
        } else if ((state.productsData[index]?.quantity ?? 0) <= 0) {
          state.productsData[index] = entry;
        }
      });
    },
    addDeliveryToCart(state, action: PayloadAction<IProductsEntity>) {
      state.delivery = action.payload;
    },
    setDeliveryData(state, action: PayloadAction<{ date: number; time: string; address: string }>) {
      state.deliveryData = {
        date: action.payload.date,
        time: action.payload.time,
        address: action.payload.address,
      };
    },
    deselectProduct(state, action: PayloadAction<number>) {
      const entry = state.productsData.find(
        (product: { id: number }) => product.id === action.payload
      );
      if (entry) {
        entry.selected = !entry.selected;
      }
    },
    removeAllReservations(state) {
      state.reservations = initialState.reservations;
    },
    setCartTransition(state, action: PayloadAction<{ productId: number }>) {
      state.transitionId = action.payload.productId;
    },
    setCartVersion(state, action: PayloadAction<number>) {
      state.version = action.payload;
    },
  },
});

export const {
  addReservationToCart,
  addProductsToCart,
  addDeliveryToCart,
  setDeliveryData,
  setProductQty,
  setCartTransition,
  deselectProduct,
  removeAllReservations,
  removeAllProducts,
  restoreCartProducts,
  setCartVersion,
  addProductToCart,
  removeProduct,
  increaseProductQty,
  decreaseProductQty,
} = cartSlice.actions;

/**
 * selectIsInCart — checks whether a product is in the cart with a positive quantity.
 *
 * Entries with `quantity <= 0` are treated as "not in cart" — this happens
 * when the persisted store contains garbage (previously `setProductQty(0)`
 * did not remove the entry), or due to a race. AddToCartButton then shows
 * "ADD TO CART" instead of the invisible QuantitySelector, and adding via
 * addProductToCart revives the entry (`quantity = 1`).
 *
 * @param   {{ cartReducer: { productsData: { id: number; quantity: number }[] } }} state - Redux root state.
 * @param   {number}                                                                id    - Product id to look up.
 * @returns `true` when the product has a positive quantity in the cart.
 */
export const selectIsInCart = (
  state: { cartReducer: { productsData: { id: number; quantity: number }[] } },
  id: number
): boolean => {
  const entry = state.cartReducer.productsData.find((product: { id: number }) => product.id === id);
  return !!entry && entry.quantity > 0;
};

/**
 * selectCartData — cart products selector (record shape: `{ id, selected, quantity }`).
 *
 * @param   {{ cartReducer: { productsData: ProductCartEntry[] } }} state - Redux root state.
 * @returns Array of cart entries.
 */
export const selectCartData = (state: {
  cartReducer: { productsData: ProductCartEntry[] };
}): ProductCartEntry[] => state.cartReducer.productsData;

/**
 * selectReservations — selector for the list of reservations (table bookings — separate from the products cart).
 *
 * @param   {{ cartReducer: { reservations: ReservationEntry[] } }} state - Redux root state.
 * @returns Array of reservation entries.
 */
export const selectReservations = (state: {
  cartReducer: { reservations: ReservationEntry[] };
}): ReservationEntry[] => state.cartReducer.reservations;

/**
 * selectDeliveryData — selector for delivery data (date, time, address).
 *
 * @param   {{ cartReducer: { deliveryData: { date: number; time: string; address: string } } }} state - Redux root state.
 * @returns Delivery slot for the current cart.
 */
export const selectDeliveryData = (state: {
  cartReducer: {
    deliveryData: {
      date: number;
      time: string;
      address: string;
    };
  };
}) => state.cartReducer.deliveryData;

/**
 * selectCartTotal — selector for the cart total price (uses the active reservation's product).
 *
 * @param   {{ cartReducer: { reservationId: number; reservations: ReservationEntry[] } }} state - Redux root state.
 * @returns Numeric price (regular or sale price) of the active reservation's product.
 */
export const selectCartTotal = (state: {
  cartReducer: {
    reservationId: number;
    reservations: ReservationEntry[];
  };
}) => {
  const rId = state.cartReducer.reservationId;
  const product = state.cartReducer.reservations[rId]?.product;
  const price = product?.price;
  const salePrice = product?.attributeValues?.sale?.value;

  return price || salePrice;
};

/**
 * selectReservationId — selector for the active reservation id.
 *
 * @param   {{ cartReducer: { reservationId: number } }} state - Redux root state.
 * @returns Numeric id of the currently active reservation.
 */
export const selectReservationId = (state: { cartReducer: { reservationId: number } }) =>
  state.cartReducer.reservationId;

/**
 * selectCartItemWithIdLength — selector for a cart item by product id.
 *
 * @param   {{ cartReducer: { productsData: ProductCartEntry[] } }} state - Redux root state.
 * @param   {number}                                                id    - Product id to look up.
 * @returns Cart entry for the product, or `undefined` if not present.
 */
export const selectCartItemWithIdLength = (
  state: {
    cartReducer: {
      productsData: ProductCartEntry[];
    };
  },
  id: number
) => state.cartReducer.productsData.find((item: { id: number }) => item.id === id);

/**
 * getTransition — returns `{ transitionId }` — product id used for transition animations.
 *
 * @param   {{ cartReducer: { transitionId: number } }} state - Redux root state.
 * @returns `{ transitionId }` wrapper for the currently transitioning product.
 */
export const getTransition = (state: {
  cartReducer: {
    transitionId: number;
  };
}): { transitionId: number } => ({
  transitionId: state.cartReducer.transitionId,
});

/**
 * selectCartVersion — cart version selector (reads `cartReducer.version`, written by `setCartVersion`).
 *
 * @param   {{ cartReducer: { version: number } }} state - Redux root state.
 * @returns Monotonic version counter that bumps when persisted cart changes are applied.
 */
export const selectCartVersion = (state: { cartReducer: { version: number } }) =>
  state.cartReducer.version;

export default cartSlice.reducer;
