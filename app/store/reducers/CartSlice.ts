'use client';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

type ProductCartEntry = {
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

      state.productsData[index] = {
        ...entry,
        selected: entry.selected,
        // Falsy-cap guard: `units = 0` means "no upper bound" (attribute not filled in CMS).
        quantity: qty <= 0 ? 0 : cap && qty > cap ? cap : qty,
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
  setCartVersion,
  addProductToCart,
  removeProduct,
  increaseProductQty,
  decreaseProductQty,
} = cartSlice.actions;

/** Checks whether a product is in the cart. */
export const selectIsInCart = (
  state: { cartReducer: { productsData: { id: number }[] } },
  id: number
): boolean => {
  const added = state.cartReducer.productsData.findIndex(
    (product: { id: number }) => product.id === id
  );
  if (added === -1) {
    return false;
  }
  return true;
};

/** Cart products selector (record shape: `{ id, selected, quantity }`). */
export const selectCartData = (state: {
  cartReducer: { productsData: ProductCartEntry[] };
}): ProductCartEntry[] => state.cartReducer.productsData;

/** Selector for the list of reservations (table bookings — separate from the products cart). */
export const selectReservations = (state: {
  cartReducer: { reservations: ReservationEntry[] };
}): ReservationEntry[] => state.cartReducer.reservations;

/** Selector for delivery data. */
export const selectDeliveryData = (state: {
  cartReducer: {
    deliveryData: {
      date: number;
      time: string;
      address: string;
    };
  };
}) => state.cartReducer.deliveryData;

/** Selector for the cart total price. */
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

/** Selector for the active reservation id. */
export const selectReservationId = (state: { cartReducer: { reservationId: number } }) =>
  state.cartReducer.reservationId;

/** Selector for a cart item by product id. */
export const selectCartItemWithIdLength = (
  state: {
    cartReducer: {
      productsData: ProductCartEntry[];
    };
  },
  id: number
) => state.cartReducer.productsData.find((item: { id: number }) => item.id === id);

/** Returns `{ transitionId }` — product id used for transition animations. */
export const getTransition = (state: {
  cartReducer: {
    transitionId: number;
  };
}): { transitionId: number } => ({
  transitionId: state.cartReducer.transitionId,
});

/** Cart version selector (reads `cartReducer.version`, written by `setCartVersion`). */
export const selectCartVersion = (state: { cartReducer: { version: number } }) =>
  state.cartReducer.version;

export default cartSlice.reducer;
