'use client';

import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  type CheckoutStep,
  goBackStep,
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

// Шаги, которые ВСЕГДА рендерятся как центрированный попап-оверлей (мобила + десктоп):
// auth-гейт (`signin` = выбор метода по `pk_login.html`) и
// код подтверждения (`verification` по `pk_verif.html`). Сами формы sign-in /
// sign-up живут в отдельном drawer (OpenDrawerContext), не здесь.
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

// Отслеживает брейкпоинт md+ (768px) на клиенте, чтобы рендерить
// тело шага ровно в одном месте — инлайн на десктопе или попап на мобиле —
// без двойного маунта компонентов StepXXX (у каждого свой state /
// effects). useSyncExternalStore читает `matchMedia` синхронно на
// первом клиентском рендере, поэтому desktop-юзер сразу попадает в инлайн-режим без
// мгновенного попап-флеша. SSR возвращает `false` (mobile-first).
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
 * CartWizard — многошаговый checkout, управляемый через `orderReducer.step`.
 *
 * Flow:
 * `cart` → `time` (пропускается, если уже выбрано через попап календаря)
 *   → `signin` (авто-скип, если авторизован; ветка phone → `verification`)
 *   → `address` → `order` (review + promo) → `payment`
 *   → `add_card` (только если выбран метод card) → `success` | `error`
 *
 * Правила рендера (по десктоп-вариантам `pk_*.html` из static-html):
 * - Шаг `cart`: товары корзины в левой колонке, промо-баннеры справа
 *   (`pk_cart.html`).
 * - Auth-шаги (`signin`, `verification`): центрированный попап-оверлей
 *   на ОБОИХ вьюпортах (`pk_login.html`, `pk_verif.html`). Корзина
 *   видна за попапом на десктопе, скрыта на мобиле.
 * - Прочие не-cart шаги (`time`, `address`, `order`, `payment`, …):
 *   - Десктоп (md+): рендерятся ИНЛАЙН на странице корзины, замещая
 *     товары корзины в левой колонке (паттерн `pk_order.html`). Хлебные крошки
 *     становятся "Cart / <Step>" с кликабельным "Cart" для возврата.
 *   - Мобила: фуллскрин-попап (`cart_*.html`).
 *
 * Поддерево корзины остаётся примонтированным между всеми переходами (видимость
 * переключается через CSS), чтобы GSAP-анимации монтирования на ProductAnimations /
 * TableRowAnimations не проигрывались заново при шагах вперёд и назад.
 * @param   {CartWizardProps} props - Пропсы wizard.
 * @returns {JSX.Element}           JSX wizard для текущего шага.
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
  // Тело шага рендерится ОДИН РАЗ — либо инлайн (десктоп, не-auth), либо в
  // попапе. Эти варианты взаимоисключающие, учитывая логику auth + вьюпорта.
  const showInline = !isCartStep && !isAuthPopup && isMdUp;
  const showPopup = !isCartStep && (isAuthPopup || !isMdUp);

  // Товары корзины в левой колонке остаются примонтированными между шагами;
  // на десктопе они скрываются через CSS, когда инлайн-шаг занимает их слот. На
  // мобиле вся корзина уже скрыта через `cartWrapperClass`.
  const hideCartProductsOnDesktop = !isCartStep && !isAuthPopup;

  // Видимость обёртки корзины:
  // - шаг cart:         `contents` — виден везде, без лишней коробки
  // - любой другой шаг: `hidden md:contents` — скрыт на мобиле (попап там
  //                     фуллскрин), виден за попапом на md+
  const cartWrapperClass = isCartStep ? 'contents' : 'hidden md:contents';

  // Десктопные хлебные крошки — остаются "Cart", пока находимся на экране корзины или
  // под auth-попапом; переключаются на "Cart / <Step>", когда активен инлайн-шаг,
  // чтобы пользователь мог кликнуть по "Cart" для возврата.
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
        {/* Хедер только для мобилы — стрелка назад + "Cart" + бургер по
            cart_cart.html */}
        <div className="flex items-center justify-between p-5 pb-0 md:hidden">
          <Link href="/" className="group_white" aria-label="Back">
            <ArrowBackOrangeIcon />
          </Link>
          <p className="font-normal text-2xl text-white">Cart</p>
          <div className="group_white">
            <BurgerOrangeIcon />
          </div>
        </div>

        {/* Хлебные крошки только для десктопа — `pk_cart.html` показывает "Cart",
            `pk_order.html` показывает "Cart / Order". Когда активен инлайн-шаг,
            "Cart" — это кнопка, возвращающая на шаг корзины. */}
        <p className="hidden pt-3.75 text-base text-muted-text md:block">
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

        {/* Стак на мобиле, 2 колонки (50/50) на md+ */}
        <div className="px-5 pt-10 pb-5 md:flex md:justify-between md:gap-15 md:px-0 md:pt-13">
          <div className="flex flex-col gap-4 md:w-1/2">
            {/* Товары корзины + APPLY — остаются примонтированными; скрыты на десктопе,
                пока инлайн-шаг занимает этот слот, скрыты на мобиле
                через внешний `cartWrapperClass`, когда активен попап. */}
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
            {/* Хедер попапа — назад / заголовок / закрыть */}
            <div className="flex items-center justify-between md:mb-2">
              <button
                type="button"
                onClick={() => dispatch(goBackStep())}
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

            {/* Панель контента шага — glass-карточка на мобиле, plain внутри
                попапа на десктопе (сам попап обеспечивает обрамление). */}
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
