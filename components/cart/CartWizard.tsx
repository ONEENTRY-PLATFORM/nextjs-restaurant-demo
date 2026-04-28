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
import ArrowBackIcon from '@/components/icons/arrow-back';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import CartPage from '@/components/layout/cart';

import StepAddCard from './steps/StepAddCard';
import StepAddress from './steps/StepAddress';
import StepOrder from './steps/StepOrder';
import StepPayment from './steps/StepPayment';
import StepResult from './steps/StepResult';
import StepSignIn from './steps/StepSignIn';
import StepTime from './steps/StepTime';
import StepVerification from './steps/StepVerification';

type CartWizardProps = {
  dict: IAttributeValues;
  deliveryData: IProductsEntity;
};

const buildStepTitles = (
  dict: IAttributeValues,
): Record<CheckoutStep, string> => ({
  cart: 'Cart',
  time: 'Select time',
  signin: (dict?.sign_in_text?.value as string | undefined) ?? 'Sign in',
  verification:
    (dict?.verification_text?.value as string | undefined) ?? 'Verification',
  address:
    (dict?.address_text?.value as string | undefined) ?? 'Delivery address',
  order: 'Order',
  payment:
    (dict?.select_payment_text?.value as string | undefined) ?? 'Payment',
  add_card:
    (dict?.select_payment_text?.value as string | undefined) ?? 'Payment',
  success: 'Success',
  error: 'Error',
});

/**
 * CartWizard — multi-step checkout driven by `orderReducer.step`.
 *
 * Flow:
 * `cart` → `time` → `signin` (auto-skip if authed; phone branch → `verification`)
 *   → `address` → `order` (review + promo) → `payment`
 *   → `add_card` (only when card method picked) → `success` | `error`
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
  const STEP_TITLES = buildStepTitles(dict);

  if (step === 'cart') {
    return (
      <div className="p-5">
        {/* Cart header — back arrow + "Cart" + hamburger per cart_cart.html */}
        <div className="flex justify-between items-center">
          <Link href="/" className="group_white" aria-label="Back">
            <ArrowBackOrangeIcon />
          </Link>
          <p className="font-normal text-[24px] text-white">Cart</p>
          <div className="group_white">
            <BurgerOrangeIcon />
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-10">
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
          <ArrowBackIcon className="hover-target" />
        </button>
        <p className="font-normal text-[24px] text-paper">
          {STEP_TITLES[step]}
        </p>
        <span className="w-6.75" aria-hidden="true" />
      </div>

      {/* Bottom-sheet style panel (glass, rounded-top, matches static-html) */}
      <div className="rounded-[20px] bg-[rgba(76,77,86,0.8)] px-5 py-6.25 backdrop-blur-[10px]">
        {step === 'time' && <StepTime dict={dict} />}
        {step === 'signin' && <StepSignIn />}
        {step === 'verification' && <StepVerification />}
        {step === 'address' && <StepAddress dict={dict} />}
        {step === 'order' && <StepOrder dict={dict} />}
        {step === 'payment' && <StepPayment dict={dict} />}
        {step === 'add_card' && <StepAddCard />}
        {step === 'success' && <StepResult variant="success" />}
        {step === 'error' && <StepResult variant="error" />}
      </div>
    </div>
  );
};

export default CartWizard;
