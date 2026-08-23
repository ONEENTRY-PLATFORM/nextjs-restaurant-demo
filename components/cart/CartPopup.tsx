'use client';

import { gsap } from 'gsap';
import type { IProductsEntity } from 'oneentry/types';
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
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import StepOrder from '@/components/cart/steps/StepOrder';
import StepPayment from '@/components/cart/steps/StepPayment';
import StepResult from '@/components/cart/steps/StepResult';
import ArrowBackIcon from '@/components/icons/arrow-back';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import Spinner from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/**
 * CartPopup — cart drawer with the full wizard (`cart` → `order` → `payment` → `success`/`error`).
 *
 * @returns JSX of the cart drawer (rendered into the modal stack via `OpenDrawerContext`).
 */
const CartPopup = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { open, component, setOpen } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'CartPopup';
  const step = useAppSelector(selectCheckoutStep);
  const isCartStep = step === 'cart';

  const productsCartData = useAppSelector(selectCartData) as IProducts[];
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: productsCartData.map(p => p.id) },
    { skip: !isOpen || productsCartData.length === 0 }
  );

  // Delivery: on `/cart` the server component fetches it; here we load it ourselves, otherwise the total on the steps is computed without it.
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

  // Closing on a non-cart step resets the wizard to 'cart' - otherwise the next open lands on an intermediate screen without context.
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen && step !== 'cart') {
      dispatch(setStep('cart'));
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, step, dispatch]);

  // APPLY on cart: reverse animation of the cards, then setStep('order'). Reset styles in onComplete so that on return the cards appear fresh.
  const handleCartApply = (): void => {
    const cards = document.querySelectorAll('.product-in-cart');
    const button = document.querySelectorAll('.cart_btn');
    if (cards.length === 0) {
      dispatch(setStep('order'));
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        dispatch(setStep('order'));
        gsap.set([cards, button], { autoAlpha: 1, yPercent: 0 });
      },
    });
    tl.to(cards, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.35,
      stagger: { each: 0.07, from: 'end' },
    }).to(button, { autoAlpha: 0, yPercent: 100, duration: 0.25 }, '-=0.15');
  };

  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Swipe closes directly, bypassing GSAP-reverse, so that the inline transform does not conflict with the `yPercent` tween.
  useSwipeToClose(sheetRef, () => setOpen(false));

  // Delivery shows as a separate line in the totals; we do not display it in the product list (same as CartPage).
  const products = (data ?? []).filter(
    (p: IProductsEntity) => p.id !== DELIVERY_PRODUCT_ID
  ) as IProductsEntity[];

  const stepTitles: Record<CheckoutStep, string> = {
    cart: t('cart_step_text', 'Cart'),
    order: t('order_step_text', 'Order'),
    payment: t('select_payment_text', 'Payment'),
    success: t('success_text', 'Success'),
    error: t('error_text', 'Error'),
  };

  // Back arrow only on intermediate steps (`order`/`payment`); terminal `success`/`error` are one-shot.
  const canGoBack = step === 'order' || step === 'payment';

  return (
    <DrawerAnimations component="CartPopup" variant="slide-up">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-20 max-h-dvh overflow-y-auto rounded-t-[20px] bg-ink/80 shadow-xl backdrop-blur-card md:top-[5vh] md:right-0 md:left-auto md:h-auto md:max-h-[90vh] md:w-95 md:rounded-t-none md:rounded-l-[20px]"
      >
        <div className="mx-auto max-w-97.5 p-5 pb-24">
          {/* Header: back / title / spacer (close is via swipe / backdrop). */}
          <div className="z-10 flex items-center justify-between">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => dispatch(goBackStep())}
                aria-label={t('go_back_label', 'Go back')}
                className="group flex size-9 items-center justify-center"
              >
                <ArrowBackIcon className="hover-target" />
              </button>
            ) : (
              <span aria-hidden="true" className="size-9" />
            )}
            <p className="text-2xl font-normal text-white">{stepTitles[step]}</p>
            <span aria-hidden="true" className="size-9" />
          </div>

          {isCartStep ? (
            <div className="mx-auto my-10 flex max-w-88.75 flex-col gap-3.75">
              {isLoading ? (
                <Spinner />
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
                    className="cart_btn mx-auto mt-7.5"
                  >
                    {t('apply_coupon_button', 'APPLY')}
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
