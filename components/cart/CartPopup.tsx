'use client';

import { gsap } from 'gsap';
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
import { type CheckoutStep, selectCheckoutStep, setStep } from '@/app/store/reducers/OrderSlice';
import type { IProducts } from '@/app/types/global';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import StepOrder from '@/components/cart/steps/StepOrder';
import StepPayment from '@/components/cart/steps/StepPayment';
import StepResult from '@/components/cart/steps/StepResult';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/**
 * CartPopup — cart drawer with the full wizard (`cart` → `order` → `payment` → `success`/`error`).
 * APPLY on the cart step toggles the Redux step, it does not navigate to `/cart`. `CartWizard` on `/cart` runs in parallel — they share the Redux step.
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

  // Closing on a non-cart step resets the wizard to 'cart' — otherwise the next open lands on an intermediate screen without context.
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
          {/* Header: back / title / close. */}
          <div className="z-10 flex items-center justify-between">
            <p className="font-normal text-[24px] text-white">{stepTitles[step]}</p>
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
