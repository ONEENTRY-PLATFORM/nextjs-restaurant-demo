'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  type CheckoutStep,
  selectCheckoutStep,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import CartPage from '@/components/layout/cart';

import StepAddCard from './steps/StepAddCard';
import StepAddress from './steps/StepAddress';
import StepPayment from './steps/StepPayment';
import StepResult from './steps/StepResult';
import StepSignIn from './steps/StepSignIn';
import StepTime from './steps/StepTime';

type CartWizardProps = {
  dict: IAttributeValues;
  deliveryData: IProductsEntity;
};

const STEP_TITLES: Record<CheckoutStep, string> = {
  cart: 'Cart',
  time: 'Select time',
  signin: 'Sign in',
  verification: 'Verification',
  address: 'Delivery address',
  payment: 'Payment',
  add_card: 'Add card',
  success: 'Success',
  error: 'Error',
};

/**
 * CartWizard — multi-step checkout driven by `orderReducer.step`.
 *
 * Flow:
 * `cart` → `time` → `signin` (auto-skip if authed) → `address` → `payment`
 *   → `add_card` (only for card) → `success` | `error`
 *
 * Non-cart steps are wrapped in a "bottom-sheet"-style container (per
 * `cart_time.html` / `cart_Sign_in.html` / `cart_add_card.html` etc.): glass
 * bg, rounded-top corners, backdrop-blur. The initial `cart` step reuses
 * the existing {@link CartPage} and mounts a "Checkout" CTA.
 * @param   {CartWizardProps} props - Wizard props.
 * @returns {JSX.Element}           Wizard JSX for the current step.
 */
const CartWizard = ({ dict, deliveryData }: CartWizardProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const step = useAppSelector(selectCheckoutStep);

  if (step === 'cart') {
    return (
      <div className="flex flex-col gap-4">
        <CartPage dict={dict} deliveryData={deliveryData} />
        <button
          type="button"
          onClick={() => dispatch(setStep('time'))}
          className="cart_btn"
        >
          Proceed to checkout
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-[393px] flex-col gap-6 px-[20px] pt-[15px] md:max-w-107.5 md:px-0">
      {/* Step header — back button + title (mirrors service_table.html chrome) */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => dispatch(setStep('cart'))}
          aria-label="Back to cart"
          className="group flex items-center gap-2 text-paper/70 transition-colors hover:text-brand"
        >
          <svg
            width="27"
            height="21"
            viewBox="0 0 27 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hover-target"
            aria-hidden="true"
          >
            <path
              d="M11.6157 0.750531C11.2648 0.395572 10.7889 0.196167 10.2926 0.196167C9.79638 0.196167 9.32046 0.395572 8.96951 0.750531L0.547949 9.27087C0.197104 9.62593 1.14441e-05 10.1074 1.14441e-05 10.6095C1.14441e-05 11.1116 0.197104 11.5931 0.547949 11.9481L8.96951 20.4685C9.32247 20.8134 9.7952 21.0042 10.2859 20.9999C10.7766 20.9956 11.246 20.7965 11.5929 20.4454C11.9399 20.0944 12.1368 19.6195 12.141 19.123C12.1453 18.6266 11.9566 18.1483 11.6157 17.7912L6.54971 12.5029H24.3286C24.8249 12.5029 25.3009 12.3034 25.6519 11.9483C26.0028 11.5933 26.2 11.1117 26.2 10.6095C26.2 10.1073 26.0028 9.62575 25.6519 9.27066C25.3009 8.91558 24.8249 8.7161 24.3286 8.7161H6.54971L11.6157 3.42781C11.9666 3.07274 12.1637 2.59123 12.1637 2.08917C12.1637 1.58711 11.9666 1.1056 11.6157 0.750531Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <p className="font-normal text-[24px] text-paper">
          {STEP_TITLES[step]}
        </p>
        <span className="w-[27px]" aria-hidden="true" />
      </div>

      {/* Bottom-sheet style panel (glass, rounded-top, matches static-html) */}
      <div className="rounded-[20px] bg-[rgba(76,77,86,0.8)] px-[20px] py-[25px] backdrop-blur-[10px]">
        {step === 'time' && <StepTime />}
        {step === 'signin' && <StepSignIn />}
        {step === 'address' && <StepAddress />}
        {step === 'payment' && <StepPayment />}
        {step === 'add_card' && <StepAddCard />}
        {step === 'success' && <StepResult variant="success" />}
        {step === 'error' && <StepResult variant="error" />}
      </div>
    </div>
  );
};

export default CartWizard;
