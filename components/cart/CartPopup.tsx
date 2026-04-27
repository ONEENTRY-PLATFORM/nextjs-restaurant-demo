'use client';

import { useRouter } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useEffect } from 'react';

import { useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addProductsToCart,
  closeCartPopup,
  selectCartData,
  selectIsCartPopupOpen,
} from '@/app/store/reducers/CartSlice';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import Loader from '@/components/shared/Spinner';

/**
 * Cart slide-in popup — port of `static-html/cart_cart.html` triggered from
 * the bottom-menu cart button. Shows the current cart items and an APPLY
 * button that hands off to the full `/cart` checkout flow.
 */
const CartPopup = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isOpen = useAppSelector(selectIsCartPopupOpen);

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

  // Lock body scroll while popup is open
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const close = () => dispatch(closeCartPopup());
  const handleApply = () => {
    close();
    router.push('/cart');
  };

  const products = (data ?? []) as IProductsEntity[];

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto bg-black bg-cover bg-no-repeat font-main">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/images/picture/bg_cart.png')" }}
      />
      <div className="max-w-97.5 mx-auto p-5 pb-24">
        <div className="flex justify-between items-center">
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
  );
};

export default CartPopup;
