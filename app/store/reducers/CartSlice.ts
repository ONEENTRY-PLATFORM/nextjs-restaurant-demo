/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

/**
 * Запись бронирования в cart-slice — представляет слот бронирования столика
 * для одного филиала ресторана. Заменяет легаси-поля `salon`/`master`
 * (из исходного шаблона salon, с которого этот репо клонировался).
 */
type ReservationEntry = {
  id: number;
  restaurant?: IPagesEntity;
  product?: IProductsEntity;
  date?: Date;
  interval?: Date[];
};

type InitialStateType = {
  products: IProductsEntity[];
  productsData: any[];
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
      state.reservations = state.reservations.map((entry) => {
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
      }>,
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id,
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
      action: PayloadAction<{ units: number; id: number; quantity: number }>,
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id,
      );
      const qty = state.productsData[index].quantity + action.payload.quantity;

      // Атрибут `units_product` отсутствует в живом наборе `dish` →
      // вызывающий код передаёт `0`/`undefined`. Считаем falsy `units` за «лимита
      // склада нет» (иначе кнопка `+` снова обрезала бы qty до 0). Когда передан
      // `units > 0` — всё равно уважаем его как реальный верхний предел.
      const cap = action.payload.units;
      state.productsData[index] = {
        ...state.productsData[index],
        selected: state.productsData[index].selected,
        quantity: cap && qty > cap ? Number(cap) : qty,
      };
    },
    decreaseProductQty(
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id,
      );
      const qty = state.productsData[index].quantity - action.payload.quantity;
      state.productsData[index] = {
        ...state.productsData[index],
        selected: state.productsData[index].selected,
        quantity: qty <= 0 ? 1 : qty,
      };
    },
    setProductQty(
      state,
      action: PayloadAction<{ units: number; id: number; quantity: number }>,
    ) {
      const index = state.productsData.findIndex(
        (product: { id: number }) => product.id === action.payload.id,
      );
      const qty = action.payload.quantity;
      const cap = action.payload.units;

      state.productsData[index] = {
        ...state.productsData[index],
        selected: state.productsData[index].selected,
        // Тот же falsy-cap guard, что и в `increaseProductQty` — считаем `units = 0`
        // за «нет верхнего предела», т.к. атрибут не заполнен в CMS.
        quantity: qty <= 0 ? 0 : cap && qty > cap ? cap : qty,
      };
    },
    removeProduct(state, action: PayloadAction<number>) {
      state.productsData = state.productsData.filter(
        (item: any) => item.id !== action.payload,
      );
    },
    removeAllProducts(state) {
      state.productsData = initialState.productsData;
      state.products = initialState.products;
    },
    addDeliveryToCart(state, action: PayloadAction<IProductsEntity>) {
      state.delivery = action.payload;
    },
    setDeliveryData(
      state,
      action: PayloadAction<{ date: number; time: string; address: string }>,
    ) {
      state.deliveryData = {
        date: action.payload.date,
        time: action.payload.time,
        address: action.payload.address,
      };
    },
    deselectProduct(state, action: PayloadAction<number>) {
      const entry = state.productsData.find(
        (product: { id: number }) => product.id === action.payload,
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

/**
 * selectIsInCart
 */
export const selectIsInCart = (
  state: { cartReducer: { productsData: { id: number }[] } },
  id: number,
): boolean => {
  const added = state.cartReducer.productsData.findIndex(
    (product: { id: number }) => product.id === id,
  );
  if (added === -1) {
    return false;
  }
  return true;
};

/**
 * Селектор товаров корзины (items, добавленные через addProductToCart).
 * Форма каждой записи: `{ id, selected, quantity }`.
 */
export const selectCartData = (state: {
  cartReducer: { productsData: any[] };
}): any => state.cartReducer.productsData;

/**
 * Селектор списка бронирований (table bookings — отдельно от корзины товаров).
 */
export const selectReservations = (state: {
  cartReducer: { reservations: any[] };
}): any => state.cartReducer.reservations;

/**
 * Селектор данных доставки
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
 * Селектор итоговой цены корзины
 */
export const selectCartTotal = (state: {
  cartReducer: {
    reservationId: any;
    reservations: any;
  };
}) => {
  const rId = state.cartReducer.reservationId;
  const product = state.cartReducer.reservations[rId]?.product;
  const price = product?.price;
  // salePrice === oldPrice
  const salePrice = product?.attributeValues?.sale?.value;

  return price || salePrice;
};

/**
 * Селектор id активного бронирования
 */
export const selectReservationId = (state: {
  cartReducer: { reservationId: number };
}) => state.cartReducer.reservationId;

/**
 * Селектор TabsState
 */
export const selectTabsState = (
  key: string,
  state: { cartReducer: { tabsState: any } },
) => state.cartReducer.tabsState[key];

/**
 * Селектор TabsState
 */
export const selectTabsData = (
  key: string,
  state: { cartReducer: { tabsState: any } },
) => state.cartReducer.tabsState[key].data;

/**
 * Селектор элемента корзины по product id
 */
export const selectCartItemWithIdLength = (
  state: {
    cartReducer: {
      productsData: any[];
    };
  },
  id: number,
) =>
  state.cartReducer.productsData.find((item: { id: number }) => item.id === id);

/**
 * Получает product id для анимаций перехода
 */
export const getTransition = (state: {
  cartReducer: {
    transitionId: number;
  };
}) => state.cartReducer;

/**
 * Селектор версии корзины
 */
export const selectCartVersion = (state: {
  favoritesReducer: { version: number };
}) => state.favoritesReducer.version;

export default cartSlice.reducer;
