/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IAdminEntity } from 'oneentry/dist/admins/adminsInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type {
  IProductsEntity,
  IProductsEntity,
} from 'oneentry/dist/products/productsInterfaces';

type InitialStateType = {
  products: IProductsEntity[];
  productsData: any[];
  delivery: IProductsEntity | null;
  deliveryData: {
    date: number;
    time: string;
    address: string;
  };
  serviceId: number;
  servicesData: {
    id: number;
    salon?: IPagesEntity;
    service?: IPagesEntity;
    product?: IProductsEntity;
    master?: IAdminEntity;
    date?: Date;
    interval?: Date[];
  }[];
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
  serviceId: 0,
  servicesData: [
    {
      id: 0,
      salon: {} as IPagesEntity,
      service: {} as IPagesEntity,
      product: {} as IProductsEntity,
      master: {} as IAdminEntity,
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
    addServiceToCart(
      state,
      action: PayloadAction<{
        id: number;
        salon?: IPagesEntity;
        service?: IPagesEntity;
        product?: IProductsEntity;
        master?: IAdminEntity;
        date?: Date;
        interval?: Date[];
      }>,
    ) {
      if (state.servicesData.length < 1) {
        state.servicesData.push(action.payload);
      }
      state.servicesData = state.servicesData.map((service) => {
        if (action.payload.id === service.id) {
          return {
            ...service,
            ...action.payload,
          };
        } else {
          return service;
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

      state.productsData[index] = {
        ...state.productsData[index],
        selected: state.productsData[index].selected,
        quantity:
          qty > action.payload.units ? Number(action.payload.units) : qty,
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

      state.productsData[index] = {
        ...state.productsData[index],
        selected: state.productsData[index].selected,
        quantity:
          qty <= 0
            ? 0
            : qty > action.payload.units
              ? action.payload.units
              : qty,
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
      state.productsData.map((product) => {
        if (product.id === action.payload) {
          product.selected = !product.selected;
        }
      });
    },
    removeAllServices(state) {
      state.servicesData = initialState.servicesData;
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
  addServiceToCart,
  addProductsToCart,
  addDeliveryToCart,
  setDeliveryData,
  setProductQty,
  setCartTransition,
  deselectProduct,
  removeAllServices,
  removeAllProducts,
  setCartVersion,
  addProductToCart,
  removeProduct,
  increaseProductQty,
  decreaseProductQty,
} = cartSlice.actions;

/**
 * selectIsInCart
 *
 * @param state
 * @param id product id
 *
 * @returns
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
 * Select cart data
 * @param state slice state
 * @returns productsData
 */
export const selectCartData = (state: {
  cartReducer: { servicesData: any[] };
}) => state.cartReducer.servicesData;

/**
 * Select delivery data
 *
 * @param state slice state
 *
 * @returns
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
 * Select cart total price
 * @param state slice state
 * @returns
 */
export const selectCartTotal = (state: {
  cartReducer: {
    serviceId: any;
    servicesData: any;
  };
}) => {
  const sId = state.cartReducer.serviceId;
  const product = state.cartReducer.servicesData[sId]?.product;
  const price = product?.price;
  // salePrice === oldPrice
  const salePrice = product.attributeValues?.sale?.value;

  return price || salePrice;
};

/**
 * Select ServiceId
 * @param state slice state
 * @returns productsData
 */
export const selectServiceId = (state: {
  cartReducer: { serviceId: number };
}) => state.cartReducer.serviceId;

/**
 * Select TabsState
 * @param state slice state
 * @returns productsData
 */
export const selectTabsState = (
  key: string,
  state: { cartReducer: { tabsState: any } },
) => state.cartReducer.tabsState[key];

/**
 * Select TabsState
 * @param state slice state
 * @returns productsData
 */
export const selectTabsData = (
  key: string,
  state: { cartReducer: { tabsState: any } },
) => state.cartReducer.tabsState[key].data;

/**
 * Select cart item by product id
 *
 * @param state slice state
 * @param id product id
 *
 * @returns
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
 * Get transition - get product id for animations
 *
 * @param state slice state
 *
 * @returns transitionId
 */
export const getTransition = (state: {
  cartReducer: {
    transitionId: number;
  };
}) => state.cartReducer;

/**
 * Select cart version
 *
 * @param state slice state
 *
 * @returns cart version
 */
export const selectCartVersion = (state: {
  favoritesReducer: { version: number };
}) => state.favoritesReducer.version;

export default cartSlice.reducer;
