'use client';

import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

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
import ClosePopupButton from '@/components/shared/ClosePopupButton';

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

// Steps that ALWAYS render as a centered popup overlay (mobile + desktop):
// the auth gate (`signin` = method chooser per `pk_login.html`) and the
// confirmation code (`verification` per `pk_verif.html`). The actual sign-in
// / sign-up forms live in a separate drawer (OpenDrawerContext), not here.
const AUTH_POPUP_STEPS: ReadonlySet<CheckoutStep> = new Set([
  'signin',
  'verification',
]);

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

// Tracks the md+ breakpoint (768px) on the client so we can render the
// step body in exactly one place — inline on desktop or popup on mobile —
// without double-mounting StepXXX components (each has its own state /
// effects). useSyncExternalStore reads `matchMedia` synchronously on the
// first client render, so a desktop user lands on inline mode without a
// brief popup-flash. SSR returns `false` (mobile-first).
const MD_QUERY = '(min-width: 768px)';
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;
const getMdServerSnapshot = (): boolean => false;
const useIsMdUp = (): boolean =>
  useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);

/**
 * CartWizard — multi-step checkout driven by `orderReducer.step`.
 *
 * Flow:
 * `cart` → `time` (skipped if already picked via the calendar popup)
 *   → `signin` (auto-skip if authed; phone branch → `verification`)
 *   → `address` → `order` (review + promo) → `payment`
 *   → `add_card` (only when card method picked) → `success` | `error`
 *
 * Rendering rules (per static-html `pk_*.html` desktop variants):
 * - `cart` step: cart products in left column, promo banners on right
 *   (`pk_cart.html`).
 * - Auth-related steps (`signin`, `verification`): centered popup overlay
 *   in BOTH viewports (`pk_login.html`, `pk_verif.html`). The cart is
 *   visible behind on desktop, hidden on mobile.
 * - Other non-cart steps (`time`, `address`, `order`, `payment`, …):
 *   - Desktop (md+): rendered INLINE on the cart page, replacing the cart
 *     products in the left column (`pk_order.html` pattern). Breadcrumb
 *     becomes "Cart / <Step>" with a clickable "Cart" to go back.
 *   - Mobile: fullscreen popup (`cart_*.html`).
 *
 * The cart subtree stays mounted across all transitions (visibility
 * toggled via CSS) so GSAP mount animations on ProductAnimations /
 * TableRowAnimations don't replay when stepping forward and back.
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
  const isMdUp = useIsMdUp();

  const isCartStep = step === 'cart';
  const isAuthPopup = AUTH_POPUP_STEPS.has(step);
  // Step body is rendered ONCE — either inline (desktop, non-auth) or in
  // the popup. These are mutually exclusive given the auth + viewport
  // logic.
  const showInline = !isCartStep && !isAuthPopup && isMdUp;
  const showPopup = !isCartStep && (isAuthPopup || !isMdUp);

  // Cart products in the left column are kept mounted across steps; on
  // desktop they hide via CSS when an inline step takes over the slot. On
  // mobile the whole cart is hidden by `cartWrapperClass` already.
  const hideCartProductsOnDesktop = !isCartStep && !isAuthPopup;

  // Cart wrapper visibility:
  // - cart step:        `contents` — visible everywhere, no extra box
  // - any other step:   `hidden md:contents` — hidden on mobile (popup is
  //                     fullscreen there), visible behind on md+
  const cartWrapperClass = isCartStep ? 'contents' : 'hidden md:contents';

  // Desktop breadcrumb — stays "Cart" while on the cart screen or under
  // an auth popup; switches to "Cart / <Step>" while an inline step is
  // active so the user can click "Cart" to return.
  const showStepInBreadcrumb = !isCartStep && !isAuthPopup;

  const stepBody = (
    <>
      {step === 'time' && <StepTime dict={dict} />}
      {step === 'signin' && <StepSignIn />}
      {step === 'verification' && <StepVerification />}
      {step === 'address' && <StepAddress dict={dict} />}
      {step === 'order' && <StepOrder dict={dict} />}
      {step === 'payment' && <StepPayment dict={dict} />}
      {step === 'add_card' && <StepAddCard />}
      {step === 'success' && <StepResult variant="success" />}
      {step === 'error' && <StepResult variant="error" />}
    </>
  );

  return (
    <>
      <div className={cartWrapperClass}>
        {/* Mobile-only header — back arrow + "Cart" + hamburger per
            cart_cart.html */}
        <div className="flex items-center justify-between p-5 pb-0 md:hidden">
          <Link href="/" className="group_white" aria-label="Back">
            <ArrowBackOrangeIcon />
          </Link>
          <p className="font-normal text-[24px] text-white">Cart</p>
          <div className="group_white">
            <BurgerOrangeIcon />
          </div>
        </div>

        {/* Desktop-only breadcrumb — `pk_cart.html` shows "Cart",
            `pk_order.html` shows "Cart / Order". When an inline step is
            active, "Cart" is a button that returns to the cart step. */}
        <p className="hidden pt-3.75 text-base text-[#969696] md:block">
          {showStepInBreadcrumb ? (
            <>
              <button
                type="button"
                onClick={() => dispatch(setStep('cart'))}
                className="hover:text-brand"
              >
                Cart
              </button>
              <span> / {STEP_TITLES[step]}</span>
            </>
          ) : (
            'Cart'
          )}
        </p>

        {/* Stacked on mobile, 2-col (50/50) on md+ */}
        <div className="px-5 pt-10 pb-5 md:flex md:justify-between md:gap-15 md:px-0 md:pt-13">
          <div className="flex flex-col gap-4 md:w-1/2">
            {/* Cart products + APPLY — kept mounted; hidden on desktop
                while an inline step occupies this slot, hidden on mobile
                via the outer `cartWrapperClass` when a popup is active. */}
            <div
              className={hideCartProductsOnDesktop ? 'md:hidden' : 'contents'}
            >
              <CartPage deliveryData={deliveryData} />
            </div>
            {showInline && <div className="hidden md:block">{stepBody}</div>}
          </div>
          {promoSidebar}
        </div>
      </div>

      {showPopup && (
        <div className="relative mx-auto flex w-full max-w-98.25 flex-col gap-6 px-5 pt-3.75 md:fixed md:inset-0 md:z-50 md:mx-0 md:max-w-none md:flex-row md:items-center md:justify-center md:bg-black/40 md:p-0 md:px-4 md:backdrop-blur-[10px]">
          <div className="flex w-full flex-col gap-6 md:relative md:max-h-[90vh] md:max-w-150 md:overflow-y-auto md:rounded-[20px] md:bg-[rgba(76,77,86,0.8)] md:p-7.5 md:backdrop-blur-[10px]">
            {/* Popup header — back / title / close */}
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
              <ClosePopupButton
                onClose={() => dispatch(setStep('cart'))}
                className="hidden md:flex"
              />
              <span className="md:hidden w-9" aria-hidden="true" />
            </div>

            {/* Step content panel — glass card on mobile, plain inside
                the popup on desktop (the popup itself supplies the
                chrome). */}
            <div className="rounded-[20px] bg-[rgba(76,77,86,0.8)] px-5 py-6.25 backdrop-blur-[10px] md:rounded-none md:bg-transparent md:p-0 md:backdrop-blur-none">
              {stepBody}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartWizard;
