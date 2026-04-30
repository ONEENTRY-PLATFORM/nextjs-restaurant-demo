import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type {
  IOrderProductData,
  IOrdersFormData,
} from 'oneentry/dist/orders/ordersInterfaces';

import type { IAppOrder } from '@/app/types/global';

export type CheckoutStep =
  | 'cart'
  | 'time'
  | 'signin'
  | 'verification'
  | 'address'
  | 'order'
  | 'payment'
  | 'add_card'
  | 'success'
  | 'error';

type InitialStateType = {
  order: IAppOrder;
  currency?: string;
  paymentMethods?: Array<{
    identifier: string;
  }>;
  step: CheckoutStep;
  stepError?: string;
  // Переживает `removeOrder()` (который сбрасывает `order` в initialState),
  // чтобы success-экран мог отрендерить реальный id, присвоенный CMS.
  lastOrderId?: number;
};

const initialState: InitialStateType = {
  order: {
    formData: [],
    products: [],
    formIdentifier: 'delivery_order',
  },
  step: 'cart',
};

const orderReducer = createSlice({
  initialState,
  name: 'order',
  reducers: {
    createOrder(state, action: PayloadAction<IAppOrder>) {
      if (!state.order) {
        state.order = action.payload;
      }
    },
    removeOrder(state) {
      state.order = initialState.order;
    },
    addData(
      state,
      action: PayloadAction<IOrdersFormData & { valid?: boolean }>,
    ) {
      if (!state.order) {
        return;
      }
      const index = state.order.formData.findIndex(
        (item: { marker: string }) => item.marker === action.payload.marker,
      );

      if (index !== -1) {
        state.order.formData[index] = action.payload;
      } else {
        state.order.formData.push(action.payload);
      }
    },
    addProducts(state, action: PayloadAction<IOrderProductData[]>) {
      if (!state.order) {
        return;
      }
      state.order.products = action.payload;
    },
    addPaymentMethods(
      state,
      action: PayloadAction<
        Array<{
          identifier: string;
        }>
      >,
    ) {
      if (!state.paymentMethods) {
        state.paymentMethods = action.payload;
      }
    },
    addPaymentMethod(state, action: PayloadAction<string>) {
      if (!state.order) {
        return;
      }
      state.order.paymentAccountIdentifier = action.payload;
    },
    addOrderCurrency(state, action: PayloadAction<string>) {
      if (!state.order) {
        return;
      }
      state.currency = action.payload;
    },
    setStep(state, action: PayloadAction<CheckoutStep>) {
      state.step = action.payload;
      if (action.payload !== 'error') {
        delete state.stepError;
      }
    },
    setStepError(state, action: PayloadAction<string>) {
      state.step = 'error';
      state.stepError = action.payload;
    },
    setLastOrderId(state, action: PayloadAction<number>) {
      state.lastOrderId = action.payload;
    },
  },
});

export const {
  removeOrder,
  createOrder,
  addData,
  addProducts,
  addPaymentMethods,
  addPaymentMethod,
  addOrderCurrency,
  setStep,
  setStepError,
  setLastOrderId,
} = orderReducer.actions;

export const selectCheckoutStep = (state: {
  orderReducer: InitialStateType;
}): CheckoutStep => state.orderReducer.step;

export const selectCheckoutStepError = (state: {
  orderReducer: InitialStateType;
}): string | undefined => state.orderReducer.stepError;

export const selectLastOrderId = (state: {
  orderReducer: InitialStateType;
}): number | undefined => state.orderReducer.lastOrderId;

export default orderReducer.reducer;
