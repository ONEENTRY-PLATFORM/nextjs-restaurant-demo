'use client';

import Link from 'next/link';
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
      <div className="p-5">
        {/* Cart header — back arrow + "Cart" + hamburger per cart_cart.html */}
        <div className="flex justify-between items-center">
          <Link href="/" className="group_white" aria-label="Back">
            <svg
              className="fill-[#EC722B] hover-target"
              width="26"
              height="20"
              viewBox="0 0 26 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5271 0.532945C11.1788 0.1917 10.7065 0 10.214 0C9.72159 0 9.2493 0.1917 8.90103 0.532945L0.543755 8.72407C0.195589 9.06542 0 9.52832 0 10.011C0 10.4937 0.195589 10.9566 0.543755 11.2979L8.90103 19.489C9.25129 19.8206 9.72042 20.0041 10.2074 19.9999C10.6943 19.9958 11.1601 19.8043 11.5044 19.4669C11.8488 19.1294 12.0441 18.6728 12.0483 18.1956C12.0526 17.7183 11.8654 17.2585 11.5271 16.9152L6.4997 11.8312H24.1428C24.6354 11.8312 25.1078 11.6395 25.456 11.2981C25.8043 10.9567 26 10.4937 26 10.011C26 9.52823 25.8043 9.06524 25.456 8.72388C25.1078 8.38251 24.6354 8.19074 24.1428 8.19074H6.4997L11.5271 3.10678C11.8752 2.76543 12.0708 2.30253 12.0708 1.81986C12.0708 1.3372 11.8752 0.874292 11.5271 0.532945Z"
                fill="#EC722B"
              />
            </svg>
          </Link>
          <p className="font-normal text-[24px] text-white">Cart</p>
          <div className="group_white">
            <svg
              className="stroke-[#ec722b] hover-target"
              width="21"
              height="17"
              viewBox="0 0 21 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.20001 2H19.3308M2.20001 8.5H19.3308M2.20001 15H19.3308"
                stroke="#EC722B"
                strokeWidth="3"
                strokeMiterlimit="10"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-[40px]">
          <CartPage dict={dict} deliveryData={deliveryData} />
          <button
            type="button"
            onClick={() => dispatch(setStep('time'))}
            className="cart_btn"
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-98.25 flex-col gap-6 px-5 pt-3.75 md:max-w-107.5 md:px-0">
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
        <span className="w-6.75" aria-hidden="true" />
      </div>

      {/* Bottom-sheet style panel (glass, rounded-top, matches static-html) */}
      <div className="rounded-[20px] bg-[rgba(76,77,86,0.8)] px-5 py-6.25 backdrop-blur-[10px]">
        {step === 'time' && <StepTime />}
        {step === 'signin' && <StepSignIn />}
        {step === 'address' && <StepAddress />}
        {step === 'payment' && <StepPayment />}
        {step === 'success' && <StepResult variant="success" />}
        {step === 'error' && <StepResult variant="error" />}
      </div>
    </div>
  );
};

export default CartWizard;
