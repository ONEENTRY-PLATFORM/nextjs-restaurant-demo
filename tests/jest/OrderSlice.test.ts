import { describe, expect, it } from '@jest/globals';

import orderReducer, {
  addData,
  addOrderCurrency,
  addPaymentMethod,
  addProducts,
  clearAppliedCoupon,
  createOrder,
  goBackStep,
  removeOrder,
  resetCheckout,
  setAppliedCoupon,
  setLastOrderId,
  setOrderForm,
  setStep,
  setStepError,
} from '@/app/store/reducers/OrderSlice';
import type { IAppOrder } from '@/app/types/global';

const initial = () => orderReducer(undefined, { type: '@@INIT' });

const emptyOrder: IAppOrder = {
  formData: [],
  products: [],
  formIdentifier: 'delivery_order',
};

describe('OrderSlice — order draft', () => {
  // Regression guard: `createOrder` only sets the draft when `state.order` is
  // falsy, but `initialState.order` is already an object, so in the normal
  // post-init lifecycle this action is effectively a no-op. The check is here
  // as a safety net against double-initialisation, not as the normal way to
  // populate the draft (see `addData` / `addProducts` for that).
  it('createOrder is a no-op once the slice is initialised', () => {
    let state = initial();
    expect(state.order.formIdentifier).toBe('delivery_order');
    state = orderReducer(state, createOrder({ ...emptyOrder, formIdentifier: 'A' }));
    expect(state.order.formIdentifier).toBe('delivery_order');
  });

  it('removeOrder resets draft AND clears appliedCoupon', () => {
    let state = initial();
    state = orderReducer(
      state,
      addData({ marker: 'name', type: 'string', value: 'Alex' } as never)
    );
    state = orderReducer(
      state,
      setAppliedCoupon({ code: 'X', totalSum: 100, totalSumWithDiscount: 80 })
    );
    state = orderReducer(state, removeOrder());
    expect(state.order.formData).toEqual([]);
    expect(state.appliedCoupon).toBeUndefined();
  });
});

describe('OrderSlice — addData', () => {
  it('appends a new field', () => {
    const state = orderReducer(
      initial(),
      addData({ marker: 'email', type: 'string', value: 'a@b.com' } as never)
    );
    expect(state.order.formData).toHaveLength(1);
  });

  it('updates the existing field with the same marker (not duplicates)', () => {
    let state = orderReducer(
      initial(),
      addData({ marker: 'email', type: 'string', value: 'a@b.com' } as never)
    );
    state = orderReducer(
      state,
      addData({ marker: 'email', type: 'string', value: 'new@b.com' } as never)
    );
    expect(state.order.formData).toHaveLength(1);
    const entry = state.order.formData[0] as { value: string };
    expect(entry.value).toBe('new@b.com');
  });
});

describe('OrderSlice — addProducts / addPaymentMethod / addOrderCurrency', () => {
  it('addProducts replaces the products array', () => {
    const state = orderReducer(initial(), addProducts([{ productId: 1, quantity: 2 } as never]));
    expect(state.order.products).toEqual([{ productId: 1, quantity: 2 }]);
  });

  it('addPaymentMethod sets paymentAccountIdentifier', () => {
    const state = orderReducer(initial(), addPaymentMethod('cash'));
    expect(state.order.paymentAccountIdentifier).toBe('cash');
  });

  it('addOrderCurrency sets the currency', () => {
    const state = orderReducer(initial(), addOrderCurrency('USD'));
    expect(state.currency).toBe('USD');
  });
});

describe('OrderSlice — setOrderForm (dynamic storage resolution)', () => {
  it('defaults the draft to the delivery_order markers', () => {
    const state = initial();
    expect(state.order.storageMarker).toBe('delivery_order');
    expect(state.order.formIdentifier).toBe('delivery_order');
  });

  it('overrides storage marker + form identifier from the resolved storage', () => {
    const state = orderReducer(
      initial(),
      setOrderForm({ storageMarker: 'my_orders', formIdentifier: 'orderForm' })
    );
    expect(state.order.storageMarker).toBe('my_orders');
    expect(state.order.formIdentifier).toBe('orderForm');
  });
});

describe('OrderSlice — setStep history stack', () => {
  it('pushes the previous step onto stepHistory on transition', () => {
    let state = initial();
    expect(state.step).toBe('cart');
    state = orderReducer(state, setStep('order'));
    expect(state.step).toBe('order');
    expect(state.stepHistory).toEqual(['cart']);
    state = orderReducer(state, setStep('payment'));
    expect(state.step).toBe('payment');
    expect(state.stepHistory).toEqual(['cart', 'order']);
  });

  it('skips no-op transitions (same step does not push)', () => {
    let state = orderReducer(initial(), setStep('order'));
    state = orderReducer(state, setStep('order'));
    expect(state.stepHistory).toEqual(['cart']);
  });

  it('caps stepHistory at 16 entries (oldest is shifted out)', () => {
    let state = initial();
    const steps = ['order', 'payment', 'cart'] as const;
    for (let i = 0; i < 20; i++) {
      state = orderReducer(state, setStep(steps[i % 3]!));
    }
    expect(state.stepHistory.length).toBeLessThanOrEqual(16);
  });

  it('clears stepError on every step that is not "error"', () => {
    let state = orderReducer(initial(), setStepError('boom'));
    expect(state.stepError).toBe('boom');
    state = orderReducer(state, setStep('order'));
    expect(state.stepError).toBeUndefined();
  });
});

describe('OrderSlice — goBackStep', () => {
  it('pops the last entry from stepHistory', () => {
    let state = orderReducer(initial(), setStep('order'));
    state = orderReducer(state, setStep('payment'));
    state = orderReducer(state, goBackStep());
    expect(state.step).toBe('order');
    expect(state.stepHistory).toEqual(['cart']);
  });

  it('falls back to "cart" when the stack is empty', () => {
    const state = orderReducer(initial(), goBackStep());
    expect(state.step).toBe('cart');
  });
});

describe('OrderSlice — setStepError', () => {
  it('pushes the current step onto history (so goBack works after error)', () => {
    let state = orderReducer(initial(), setStep('payment'));
    state = orderReducer(state, setStepError('Stripe not configured'));
    expect(state.step).toBe('error');
    expect(state.stepError).toBe('Stripe not configured');
    // history should now contain 'cart' (from setStep) + 'payment' (from setStepError).
    expect(state.stepHistory).toEqual(['cart', 'payment']);
  });

  it('does NOT push again when transitioning error -> error', () => {
    let state = orderReducer(initial(), setStepError('first'));
    const histBefore = state.stepHistory.length;
    state = orderReducer(state, setStepError('second'));
    expect(state.stepHistory.length).toBe(histBefore);
    expect(state.stepError).toBe('second');
  });
});

describe('OrderSlice — resetCheckout / setLastOrderId', () => {
  it('resetCheckout returns to cart and clears history', () => {
    let state = orderReducer(initial(), setStep('order'));
    state = orderReducer(state, setStep('payment'));
    state = orderReducer(state, resetCheckout());
    expect(state.step).toBe('cart');
    expect(state.stepHistory).toEqual([]);
  });

  it('setLastOrderId records the id for the success screen (survives removeOrder)', () => {
    let state = orderReducer(initial(), setLastOrderId(42));
    state = orderReducer(state, removeOrder());
    expect(state.lastOrderId).toBe(42);
  });
});

describe('OrderSlice — coupon', () => {
  it('setAppliedCoupon stores the coupon', () => {
    const coupon = { code: 'SUMMER10', totalSum: 100, totalSumWithDiscount: 90 };
    const state = orderReducer(initial(), setAppliedCoupon(coupon));
    expect(state.appliedCoupon).toEqual(coupon);
  });

  it('clearAppliedCoupon removes it', () => {
    let state = orderReducer(
      initial(),
      setAppliedCoupon({ code: 'X', totalSum: 1, totalSumWithDiscount: 1 })
    );
    state = orderReducer(state, clearAppliedCoupon());
    expect(state.appliedCoupon).toBeUndefined();
  });
});
