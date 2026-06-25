import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IOrderProductData, IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

import type { IAppOrder } from '@/app/types/global';
import { FORMS } from '@/app/utils/constants';

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
  // Bonus points the user opted to spend on this order. Sent to `previewOrder`
  // and `createOrder` as `bonusAmount`; the server caps it to the amount due.
  bonusAmount?: number;
};

const initialState: InitialStateType = {
  order: {
    formData: [],
    products: [],
    storageMarker: FORMS.deliveryOrder,
    formIdentifier: FORMS.deliveryOrder,
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
      delete state.bonusAmount;
    },
    setAppliedCoupon(state, action: PayloadAction<AppliedCoupon>) {
      state.appliedCoupon = action.payload;
    },
    clearAppliedCoupon(state) {
      delete state.appliedCoupon;
    },
    setBonusAmount(state, action: PayloadAction<number>) {
      if (action.payload > 0) {
        state.bonusAmount = action.payload;
      } else {
        delete state.bonusAmount;
      }
    },
    clearBonusAmount(state) {
      delete state.bonusAmount;
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
    /**
     * Set the resolved order-storage marker + form identifier (from `getOrdersStorageByMarker`),
     * so `createOrder` targets the storage/form configured in the admin panel instead of a
     * hard-coded `delivery_order` marker.
     */
    setOrderForm(state, action: PayloadAction<{ storageMarker: string; formIdentifier: string }>) {
      if (!state.order) {
        return;
      }
      state.order.storageMarker = action.payload.storageMarker;
      state.order.formIdentifier = action.payload.formIdentifier;
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
  setOrderForm,
  addOrderCurrency,
  setStep,
  goBackStep,
  resetCheckout,
  setStepError,
  setLastOrderId,
  setAppliedCoupon,
  clearAppliedCoupon,
  setBonusAmount,
  clearBonusAmount,
} = orderReducer.actions;

/**
 * selectCheckoutStep — selector for the active checkout step.
 *
 * @param   {{ orderReducer: InitialStateType }} state - Redux root state.
 * @returns Current checkout step.
 */
export const selectCheckoutStep = (state: { orderReducer: InitialStateType }): CheckoutStep =>
  state.orderReducer.step;

/**
 * selectCheckoutStepError — selector for the error message attached to the `error` step (if any).
 *
 * @param   {{ orderReducer: InitialStateType }} state - Redux root state.
 * @returns Error message, or `undefined` when no error is set.
 */
export const selectCheckoutStepError = (state: {
  orderReducer: InitialStateType;
}): string | undefined => state.orderReducer.stepError;

/**
 * selectLastOrderId — selector for the id of the last successfully created order.
 *
 * @param   {{ orderReducer: InitialStateType }} state - Redux root state.
 * @returns Last order id, or `undefined` when no order has been completed yet.
 */
export const selectLastOrderId = (state: { orderReducer: InitialStateType }): number | undefined =>
  state.orderReducer.lastOrderId;

/**
 * selectAppliedCoupon — selector for the coupon applied to the current cart (if any).
 *
 * @param   {{ orderReducer: InitialStateType }} state - Redux root state.
 * @returns Applied coupon descriptor, or `undefined` when no coupon is applied.
 */
export const selectAppliedCoupon = (state: {
  orderReducer: InitialStateType;
}): AppliedCoupon | undefined => state.orderReducer.appliedCoupon;

/**
 * selectBonusAmount — selector for the bonus points the user opted to spend on the current order.
 *
 * @param   {{ orderReducer: InitialStateType }} state - Redux root state.
 * @returns Bonus amount to apply, or `undefined` when the user is not paying with bonuses.
 */
export const selectBonusAmount = (state: { orderReducer: InitialStateType }): number | undefined =>
  state.orderReducer.bonusAmount;

export default orderReducer.reducer;
