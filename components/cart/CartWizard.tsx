'use client';

import { gsap } from 'gsap';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';
import { Fragment, useEffect, useSyncExternalStore } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import {
  type CheckoutStep,
  goBackStep,
  resetCheckout,
  selectCheckoutStep,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import HomeIcon from '@/components/icons/home';
import CartPage from '@/components/layout/cart';
import ClosePopupButton from '@/components/shared/ClosePopupButton';

import StepOrder from './steps/StepOrder';
import StepPayment from './steps/StepPayment';
import StepResult from './steps/StepResult';

type CartWizardProps = {
  deliveryData: IProductsEntity;
  promoSidebar?: ReactNode;
};

/**
 * buildStepTitles — builds the localized title map for the checkout wizard steps.
 *
 * @param   {(marker: string, fallback: string) => string} t - Dictionary translator function.
 * @returns Map from `CheckoutStep` to display title.
 */
const buildStepTitles = (
  t: (marker: string, fallback: string) => string
): Record<CheckoutStep, string> => ({
  cart: t('cart_step_text', 'Cart'),
  order: t('order_step_text', 'Order'),
  payment: t('select_payment_text', 'Payment'),
  success: t('success_text', 'Success'),
  error: t('error_text', 'Error'),
});

// Canonical order of checkout steps
const CHECKOUT_FLOW: CheckoutStep[] = ['cart', 'order', 'payment'];

/**
 * buildBreadcrumbPath — derives the breadcrumb trail leading to the current checkout step.
 *
 * @param   {CheckoutStep}   current - Active checkout step.
 * @returns Ordered list of steps from `cart` to (and including) `current`.
 */
const buildBreadcrumbPath = (current: CheckoutStep): CheckoutStep[] => {
  const idx = CHECKOUT_FLOW.indexOf(current);
  if (idx >= 0) return CHECKOUT_FLOW.slice(0, idx + 1);
  return [...CHECKOUT_FLOW, current];
};

// Tracks the md+ (768px) breakpoint on the client to render the step body in exactly one place
const MD_QUERY = '(min-width: 768px)';
/**
 * subscribeMd — `useSyncExternalStore` subscriber for the `md` (768px+) media query.
 *
 * @param   {() => void}   cb - Change listener triggered whenever the match state flips.
 * @returns Unsubscribe function.
 */
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
/**
 * getMdSnapshot — current client snapshot of the `md` media query match state.
 *
 * @returns `true` when the viewport currently matches `md` (>= 768px).
 */
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;
/**
 * getMdServerSnapshot — server snapshot for the `md` media query (always `false`).
 *
 * @returns Always `false` so SSR renders the mobile layout deterministically.
 */
const getMdServerSnapshot = (): boolean => false;
/**
 * useIsMdUp — `useSyncExternalStore` hook returning whether the viewport is md+ (`min-width: 768px`).
 *
 * @returns `true` on md+ viewports, `false` otherwise (server snapshot is `false`).
 */
const useIsMdUp = (): boolean =>
  useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);

/**
 * CartWizard — multi-step checkout driven by `orderReducer.step`.
 *
 * Flow: `cart` → `order` (review + promo) → `payment` (address + time + payment in one step) →
 * `success` | `error`.
 *
 * Authorization runs through the canonical `Modal` + `AuthProviderSelect` (`OpenDrawerContext`)
 * launched from `CartPage.onApply`. The wizard itself does not render sign-in — after a successful
 * login, `CartPage` auto-advances to `order`.
 *
 * @param   {CartWizardProps}  props              - Component props.
 * @param   {IProductsEntity}  props.deliveryData - OneEntry product representing the delivery service line item.
 * @param   {ReactNode}        [props.promoSidebar] - Optional promo sidebar rendered next to the cart on md+.
 * @returns JSX of the wizard for the current step.
 */
const CartWizard = ({ deliveryData, promoSidebar }: CartWizardProps): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const step = useAppSelector(selectCheckoutStep);
  const STEP_TITLES = buildStepTitles(t);
  const isMdUp = useIsMdUp();

  // Terminal steps (success/error) are one-shot.
  useEffect(() => {
    if (step === 'success' || step === 'error') {
      dispatch(resetCheckout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCartStep = step === 'cart';
  const breadcrumbPath = buildBreadcrumbPath(step);
  const showInline = !isCartStep && isMdUp;
  const showPopup = !isCartStep && !isMdUp;

  // Return from an inline step (order/payment/¦) back to the cart step via breadcrumb.
  const handleBackToCart = (): void => {
    const orderRows = document.querySelectorAll('.step-order-row');

    const replayCartEntrance = (): void => {
      requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.product-in-cart');
        const button = document.querySelectorAll('.cart-apply-btn');
        if (cards.length === 0) return;
        const tl = gsap.timeline();
        tl.set([cards, button], { autoAlpha: 0, yPercent: 100 })
          .to(cards, { autoAlpha: 1, yPercent: 0, duration: 0.4, stagger: 0.08 })
          .to(button, { autoAlpha: 1, yPercent: 0, duration: 0.3 }, '-=0.2');
      });
    };

    if (orderRows.length === 0) {
      dispatch(setStep('cart'));
      replayCartEntrance();
      return;
    }
    gsap.to(orderRows, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.35,
      stagger: { each: 0.07, from: 'end' },
      onComplete: () => {
        dispatch(setStep('cart'));
        gsap.set(orderRows, { autoAlpha: 1, yPercent: 0 });
        replayCartEntrance();
      },
    });
  };

  // Cart wrapper visibility
  const cartWrapperClass = isCartStep ? 'contents' : 'hidden md:contents';

  // Desktop breadcrumbs
  const showStepInBreadcrumb = !isCartStep;

  // Navigate by clicking in the breadcrumbs.
  const goToStep = (target: CheckoutStep): void => {
    if (target === step) return;
    if (target === 'cart') {
      handleBackToCart();
      return;
    }
    dispatch(setStep(target));
  };

  const handleBreadcrumbBack = (): void => {
    const prev = breadcrumbPath[breadcrumbPath.length - 2];
    if (prev) goToStep(prev);
  };

  const stepBody = (
    <>
      {step === 'order' && <StepOrder />}
      {step === 'payment' && <StepPayment />}
      {step === 'success' && <StepResult variant="success" />}
      {step === 'error' && <StepResult variant="error" />}
    </>
  );

  return (
    <>
      <div className={cartWrapperClass}>
        {/* Mobile-only header */}
        <div className="flex items-center justify-between p-5 pb-0 md:hidden">
          <Link href="/" className="group_white" aria-label={t('go_back_label', 'Go back')}>
            <ArrowBackOrangeIcon />
          </Link>
          <p className="font-normal text-2xl text-white">{STEP_TITLES.cart}</p>
          <div className="group_white">
            <BurgerOrangeIcon />
          </div>
        </div>

        {/* Desktop-only breadcrumbs. */}
        <div className="hidden items-center gap-2.5 text-base text-muted-text md:flex">
          {showStepInBreadcrumb ? (
            <button
              type="button"
              onClick={handleBreadcrumbBack}
              aria-label={t('go_back_label', 'Go back')}
              className="transition-colors hover:text-brand"
            >
              <ArrowBackIcon className="h-3.5 w-auto" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label={t('home_label', 'Home')}
              className="group inline-flex h-4 w-4 items-center justify-center"
            >
              <HomeIcon />
            </Link>
          )}
          <p>
            {breadcrumbPath.map((s, i) => {
              const isLast = i === breadcrumbPath.length - 1;
              return (
                <Fragment key={s}>
                  {i > 0 && ' / '}
                  {isLast ? (
                    <span>{STEP_TITLES[s]}</span>
                  ) : (
                    <button type="button" onClick={() => goToStep(s)} className="hover:text-brand">
                      {STEP_TITLES[s]}
                    </button>
                  )}
                </Fragment>
              );
            })}
          </p>
        </div>

        {/* Stacked on mobile, 2 columns (50/50) on md+ */}
        <div className="px-5 pt-10 pb-5 md:flex md:justify-between gap-8 lg:gap-15 md:px-0 md:pt-13">
          <div className="flex flex-col gap-4 md:w-1/2">
            <div className={isCartStep ? 'contents' : 'md:hidden'}>
              <CartPage deliveryData={deliveryData} />
            </div>
            {showInline && <div className="hidden md:block">{stepBody}</div>}
          </div>
          {promoSidebar}
        </div>
      </div>

      {showPopup && (
        <div className="relative mx-auto flex w-full max-w-98.25 flex-col gap-6 px-5 pt-3.75 md:fixed md:inset-0 md:z-50 md:mx-0 md:max-w-none md:flex-row md:items-center md:justify-center md:bg-black/40 md:p-0 md:px-4 md:backdrop-blur-card">
          <div className="flex w-full flex-col gap-6 md:relative md:max-h-[90vh] md:max-w-150 min-h-140 md:overflow-y-auto md:rounded-[20px] md:bg-ink/80 md:p-7.5 md:backdrop-blur-card">
            {/* Popup header - back / title / close */}
            <div className="flex items-center justify-between md:mb-2">
              <button
                type="button"
                onClick={() => dispatch(goBackStep())}
                aria-label={t('go_back_label', 'Go back')}
                className="group flex h-9 w-9 items-center justify-center"
              >
                <ArrowBackIcon className="hover-target" />
              </button>
              <p className="font-normal text-2xl text-paper md:font-semibold md:uppercase md:text-brand">
                {STEP_TITLES[step]}
              </p>
              <ClosePopupButton
                onClose={() => dispatch(setStep('cart'))}
                className="hidden md:flex"
              />
              <span className="md:hidden w-9" aria-hidden="true" />
            </div>

            {/* Step content panel. */}
            <div className="px-5 py-6.25 pb-25">{stepBody}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartWizard;
