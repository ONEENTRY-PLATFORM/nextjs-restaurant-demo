'use client';

import { useRouter } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useRef } from 'react';

import { useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import {
  addProductsToCart,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import CartPopupAnimations from './animations/CartPopupAnimations';

/**
 * Попап-drawer корзины — порт `static-html/cart_cart.html`, открывается с
 * кнопки корзины в bottom-menu. Зеркалит drawer-паттерн {@link FilterModal}:
 * управляется через `OpenDrawerContext` (`open` + `component === 'CartPopup'`),
 * обёрнут в slide-in анимацию + backdrop. APPLY передаёт управление полному
 * флоу checkout `/cart`.
 */
const CartPopup = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { open, component, setOpen, setTransition } =
    useContext(OpenDrawerContext);
  const isOpen = open && component === 'CartPopup';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsCartData = useAppSelector(selectCartData) as any[];
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: productsCartData.map((p) => p.id) },
    { skip: !isOpen || productsCartData.length === 0 },
  );

  useEffect(() => {
    if (data) {
      dispatch(addProductsToCart(data));
    }
  }, [data, dispatch]);

  const close = () => setTransition('close');
  const handleApply = () => {
    close();
    router.push('/cart');
  };

  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп закрывает напрямую, минуя GSAP-reverse, чтобы не было
  // конфликта между inline-transform и `yPercent`-tween анимации.
  useSwipeToClose(sheetRef, () => setOpen(false));

  const products = (data ?? []) as IProductsEntity[];

  return (
    <CartPopupAnimations>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 overflow-y-auto bg-ink/80 backdrop-blur-[10px] rounded-t-[20px] shadow-xl md:left-auto md:right-0 md:top-[5vh] md:h-auto md:w-95 md:rounded-l-[20px] md:rounded-t-none"
      >
        <div className="max-w-97.5 mx-auto p-5 pb-24">
          {/* Шапка sticky к верху скролл-контейнера попапа — тот же паттерн,
              что и в FavoritesPopup: -mx/-mt компенсируют родительский p-5,
              -top-5 компенсирует собственный pt-5 при «прилипании», bg+blur
              перекрывает уходящий вверх контент. */}
          <div className="z-10 flex items-center justify-between">
            <button
              type="button"
              onClick={close}
              aria-label="Close cart"
              className="group_white"
            >
              <ArrowBackOrangeIcon />
            </button>
            <p className="font-normal text-[24px] text-white">Cart</p>
            <button
              type="button"
              onClick={close}
              aria-label="Menu"
              className="group_white"
            >
              <BurgerOrangeIcon />
            </button>
          </div>

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
                    selected={productsCartData[i]?.selected}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleApply}
                  className="cart_btn mt-7.5 mx-auto"
                >
                  APPLY
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <ModalBackdrop />
    </CartPopupAnimations>
  );
};

export default CartPopup;
