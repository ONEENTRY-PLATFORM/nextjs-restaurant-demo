import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IOrderProductData, IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

import type { IAppOrder } from '@/app/types/global';

export type CheckoutStep = 'cart' | 'order' | 'payment' | 'success' | 'error';

export type AppliedCoupon = {
  code: string;
  totalSum: number;
  totalSumWithDiscount: number;
  currency?: string;
};

type InitialStateType = {
  order: IAppOrder;
  currency?: string;
  paymentMethods?: Array<{
    identifier: string;
  }>;
  step: CheckoutStep;
  // Stack of previous steps — pushed on every `setStep`, popped via
  // `goBackStep`. Lets the popup "back" button return to the actual
  // previous step instead of unconditionally going back to `cart`.
  stepHistory: CheckoutStep[];
  stepError?: string;
  // Survives `removeOrder()` (which resets `order` to initialState) so the
  // success screen can render the real id assigned by the CMS.
  lastOrderId?: number;
  appliedCoupon?: AppliedCoupon;
};

const initialState: InitialStateType = {
  order: {
    formData: [],
    products: [],
    formIdentifier: 'delivery_order',
  },
  step: 'cart',
  stepHistory: [],
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
      delete state.appliedCoupon;
    },
    setAppliedCoupon(state, action: PayloadAction<AppliedCoupon>) {
      state.appliedCoupon = action.payload;
    },
    clearAppliedCoupon(state) {
      delete state.appliedCoupon;
    },
    addData(state, action: PayloadAction<IOrdersFormData & { valid?: boolean }>) {
      if (!state.order) {
        return;
      }
      const index = state.order.formData.findIndex(
        (item: { marker: string }) => item.marker === action.payload.marker
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
      >
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
      // Ignore no-op transitions and don't push history when returning to the same step.
      if (state.step !== action.payload) {
        // Cap on the stack — guards against long forward/back loops in a single popup.
        state.stepHistory.push(state.step);
        if (state.stepHistory.length > 16) {
          state.stepHistory.shift();
        }
      }
      state.step = action.payload;
      if (action.payload !== 'error') {
        delete state.stepError;
      }
    },
    /**
     * Go back to the previous step from `stepHistory`. If the stack is empty,
     * fall back to `cart` (which closes the popup, because `showPopup` is false
     * when `step === 'cart'`).
     */
    goBackStep(state) {
      const previous = state.stepHistory.pop();
      state.step = previous ?? 'cart';
      delete state.stepError;
    },
    /**
     * Full reset of the wizard to its initial state. Called after terminal
     * steps (`success`/`error`); otherwise, due to Redux persistence, the next
     * visit to `/cart` would render `StepResult` over the cart.
     */
    resetCheckout(state) {
      state.step = 'cart';
      state.stepHistory = [];
      delete state.stepError;
    },
    setStepError(state, action: PayloadAction<string>) {
      if (state.step !== 'error') {
        state.stepHistory.push(state.step);
      }
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
  goBackStep,
  resetCheckout,
  setStepError,
  setLastOrderId,
  setAppliedCoupon,
  clearAppliedCoupon,
} = orderReducer.actions;

export const selectCheckoutStep = (state: { orderReducer: InitialStateType }): CheckoutStep =>
  state.orderReducer.step;

export const selectCheckoutStepError = (state: {
  orderReducer: InitialStateType;
}): string | undefined => state.orderReducer.stepError;

export const selectLastOrderId = (state: { orderReducer: InitialStateType }): number | undefined =>
  state.orderReducer.lastOrderId;

export const selectAppliedCoupon = (state: {
  orderReducer: InitialStateType;
}): AppliedCoupon | undefined => state.orderReducer.appliedCoupon;

export default orderReducer.reducer;
