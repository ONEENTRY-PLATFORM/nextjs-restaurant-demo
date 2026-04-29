'use client';

import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  type CheckoutStep,
  selectCheckoutStep,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';
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
  promoSidebar?: ReactNode;
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
 * `cart` → `time` (skipped if already picked via the calendar popup)
 *   → `signin` (auto-skip if authed; phone branch → `verification`)
 *   → `address` → `order` (review + promo) → `payment`
 *   → `add_card` (only when card method picked) → `success` | `error`
 *
 * The `cart` step is the bottom layer of the screen; every other step is
 * an overlay popup card centered over the cart (per `pk_sing_in.html` /
 * `pk_sing_up.html` / `pk_verif.html` modal layout). The cart stays
 * rendered behind, blurred — no full-page swap, so cart animations don't
 * replay when stepping back.
 * @param   {CartWizardProps} props - Wizard props.
 * @returns {JSX.Element}           Wizard JSX for the current step.
 */
const CartWizard = ({
  dict,
  deliveryData,
  promoSidebar,
}: CartWizardProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const step = useAppSelector(selectCheckoutStep);
  const STEP_TITLES = buildStepTitles(dict);

  const cartScreen = (
    <>
      {/* Mobile-only header — back arrow + "Cart" + hamburger per cart_cart.html */}
      <div className="flex items-center justify-between p-5 pb-0 md:hidden">
        <Link href="/" className="group_white" aria-label="Back">
          <ArrowBackOrangeIcon />
        </Link>
        <p className="font-normal text-[24px] text-white">Cart</p>
        <div className="group_white">
          <BurgerOrangeIcon />
        </div>
      </div>

      {/* Desktop-only breadcrumb-style label per pk_cart.html */}
      <p className="hidden pt-3.75 text-base text-[#969696] md:block">Cart</p>

      {/* Stacked on mobile, 2-col (50/50) on md+ */}
      <div className="px-5 pt-10 pb-5 md:flex md:justify-between md:gap-15 md:px-0 md:pt-13">
        <div className="flex flex-col gap-4 md:w-1/2">
          <CartPage deliveryData={deliveryData} />
        </div>
        {promoSidebar}
      </div>
    </>
  );

  if (step === 'cart') {
    return cartScreen;
  }

  // Mobile: render step fullscreen (cart hidden) per `cart_Sign_in.html`
  // / `cart_time.html`. Desktop (md+): render cart underneath + centered
  // popup card per `pk_sing_in.html` / `pk_verif.html`.
  return (
    <>
      <div className="hidden md:contents">{cartScreen}</div>
      <div className="relative mx-auto flex w-full max-w-98.25 flex-col gap-6 px-5 pt-3.75 md:fixed md:inset-0 md:z-50 md:mx-0 md:max-w-none md:flex-row md:items-start md:justify-center md:overflow-y-auto md:bg-black/40 md:p-0 md:px-4 md:py-20 md:backdrop-blur-[10px]">
        <div className="flex w-full flex-col gap-6 md:relative md:max-w-150 md:rounded-[20px] md:bg-[rgba(76,77,86,0.8)] md:p-7.5 md:backdrop-blur-[10px]">
          {/* Step header — back / title / close */}
          <div className="flex items-center justify-between md:mb-2">
            <button
              type="button"
              onClick={() => dispatch(setStep('cart'))}
              aria-label="Back"
              className="group flex h-9 w-9 items-center justify-center"
            >
              <ArrowBackIcon className="hover-target" />
            </button>
            <p className="font-normal text-[24px] text-paper md:font-semibold md:uppercase md:text-brand">
              {STEP_TITLES[step]}
            </p>
            <button
              type="button"
              onClick={() => dispatch(setStep('cart'))}
              aria-label="Close"
              className="group hidden h-11.5 w-11.5 items-center justify-center rounded-full border border-paper hover:border-brand md:flex"
            >
              <CloseXBoldIcon className="hover-target h-3.75 w-3.75" />
            </button>
            <span className="md:hidden w-9" aria-hidden="true" />
          </div>

          {/* Step content panel — glass card on mobile, plain inside the
              popup on desktop (the popup itself supplies the chrome). */}
          <div className="rounded-[20px] bg-[rgba(76,77,86,0.8)] px-5 py-6.25 backdrop-blur-[10px] md:rounded-none md:bg-transparent md:p-0 md:backdrop-blur-none">
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
      </div>
    </>
  );
};

export default CartWizard;
