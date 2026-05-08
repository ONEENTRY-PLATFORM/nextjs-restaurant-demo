'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useRef } from 'react';

import { useGetProductByIdQuery, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import {
  addDeliveryToCart,
  addProductsToCart,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import {
  type CheckoutStep,
  goBackStep,
  selectCheckoutStep,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import type { IProducts } from '@/app/types/global';
import StepOrder from '@/components/cart/steps/StepOrder';
import StepPayment from '@/components/cart/steps/StepPayment';
import StepResult from '@/components/cart/steps/StepResult';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

// id продукта-доставки. Соответствует серверной выборке в `app/cart/page.tsx` —
// нужен для StepPayment / StepOrder (delivery price в `total`).
const DELIVERY_PRODUCT_ID = 83;

/**
 * Попап-drawer корзины — порт `static-html/cart_cart.html`, открывается с
 * кнопки корзины в bottom-menu и из «Repeat order» в `OrdersList`. Зеркалит
 * drawer-паттерн {@link FilterModal}: управляется через `OpenDrawerContext`
 * (`open` + `component === 'CartPopup'`), обёрнут в slide-in анимацию + backdrop.
 *
 * Внутри попапа крутится весь wizard (`cart` → `order` → `payment` → `success`/
 * `error`) — APPLY на cart-шаге не уводит на `/cart`, а переключает Redux-step,
 * и попап рендерит контент следующего шага. Кнопка «назад» поднимается по стеку
 * шагов через `goBackStep`. На `/cart` параллельно работает `CartWizard`, у
 * него та же модель шагов — Redux-step единственный источник правды для обоих.
 */
const CartPopup = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'CartPopup';
  const step = useAppSelector(selectCheckoutStep);
  const isCartStep = step === 'cart';

  const productsCartData = useAppSelector(selectCartData) as IProducts[];
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: productsCartData.map(p => p.id) },
    { skip: !isOpen || productsCartData.length === 0 }
  );

  // Подгружаем продукт-доставку. На `/cart` это делает server-component, но
  // когда поппап открывают из bottom-меню или «Repeat order», мы можем быть
  // вне `/cart` и `cartReducer.delivery` тогда пустой — total в шагах считался
  // бы без доставки.
  const { data: deliveryProduct } = useGetProductByIdQuery(
    { id: DELIVERY_PRODUCT_ID },
    { skip: !isOpen }
  );

  useEffect(() => {
    if (data) {
      dispatch(addProductsToCart(data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (deliveryProduct) {
      dispatch(addDeliveryToCart(deliveryProduct as IProductsEntity));
    }
  }, [deliveryProduct, dispatch]);

  // Когда попап закрывается на любом не-cart шаге — сбрасываем wizard на 'cart',
  // чтобы при следующем открытии не оказаться на промежуточном или success/error
  // экране без контекста.
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen && step !== 'cart') {
      dispatch(setStep('cart'));
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, step, dispatch]);

  const close = (): void => setTransition('close');

  // APPLY на шаге cart — переход к step='order' внутри попапа.
  const handleCartApply = (): void => {
    dispatch(setStep('order'));
  };

  // Назад: на cart-шаге закрываем попап, на остальных — поднимаемся по стеку.
  const handleBack = (): void => {
    if (isCartStep) {
      close();
    } else {
      dispatch(goBackStep());
    }
  };

  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп закрывает напрямую, минуя GSAP-reverse, чтобы не было
  // конфликта между inline-transform и `yPercent`-tween анимации.
  useSwipeToClose(sheetRef, () => setOpen(false));

  const products = (data ?? []) as IProductsEntity[];

  const stepTitles: Record<CheckoutStep, string> = {
    cart: 'Cart',
    order: 'Order',
    payment: t('select_payment_text', 'Payment'),
    success: 'Success',
    error: 'Error',
  };

  return (
    <DrawerAnimations component="CartPopup" variant="slide-up">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 max-h-[90vh] overflow-y-auto bg-ink/80 backdrop-blur-[10px] rounded-t-[20px] shadow-xl md:left-auto md:right-0 md:top-[5vh] md:h-auto md:max-h-[90vh] md:w-95 md:rounded-l-[20px] md:rounded-t-none"
      >
        <div className="max-w-97.5 mx-auto p-5 pb-24">
          {/* Шапка — back / title / close. На cart-шаге back закрывает попап,
              на других шагах поднимается по wizard-стеку. */}
          <div className="z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              aria-label={isCartStep ? 'Close cart' : 'Back'}
              className="group_white"
            >
              <ArrowBackOrangeIcon />
            </button>
            <p className="font-normal text-[24px] text-white">{stepTitles[step]}</p>
            <button type="button" onClick={close} aria-label="Close" className="group_white">
              <BurgerOrangeIcon />
            </button>
          </div>

          {isCartStep ? (
            <div className="max-w-88.75 mx-auto mt-10 mb-10 flex flex-col gap-3.75">
              {isLoading ? (
                <Loader />
              ) : products.length === 0 ? (
                <EmptyCart />
              ) : (
                <>
                  {products.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      index={i}
                      product={product}
                      selected={productsCartData[i]?.selected as boolean}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleCartApply}
                    className="cart_btn mt-7.5 mx-auto"
                  >
                    APPLY
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-7.5 mb-10">
              {step === 'order' && <StepOrder />}
              {step === 'payment' && <StepPayment />}
              {step === 'success' && <StepResult variant="success" />}
              {step === 'error' && <StepResult variant="error" />}
            </div>
          )}
        </div>
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default CartPopup;
