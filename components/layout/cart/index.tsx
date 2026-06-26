/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { gsap } from 'gsap';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getApi, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import {
  addDeliveryToCart,
  addProductsToCart,
  removeProduct,
  selectCartData,
  selectDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { addData, setStep } from '@/app/store/reducers/OrderSlice';
import type { IProducts } from '@/app/types/global';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import CartAnimations from '@/components/layout/cart/animations/CartAnimations';
import TableRowAnimations from '@/components/layout/cart/animations/TableRowAnimations';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import CartListSkeleton from '@/components/shared/skeletons/CartListSkeleton';

/**
 * CartPage — list of products in the cart + APPLY button (proceed to checkout).
 *
 * @param   {object}            props              - Component props.
 * @param   {IProductsEntity}   props.deliveryData - OneEntry product representing the delivery service line item.
 * @returns JSX of the cart page (loader, empty state, or product list with APPLY).
 */
const CartPage = ({ deliveryData }: { deliveryData: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { isAuth, user } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const [products, setProducts] = useState<IProductsEntity[]>([]);
  const cartDelivery = useAppSelector(selectDeliveryData);
  // "Continue to order after sign-in" flag - otherwise any login from the header would switch cart -> order.
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Mirror delivery state into OrderSlice.formData so the `payment` step submit has delivery_time/address.
  useEffect(() => {
    const date = cartDelivery.date;
    const time = cartDelivery.time;
    const addressReg = user?.formData.find(el => el.marker === 'address_reg')?.value ?? '';
    const address = (cartDelivery.address as string | undefined) || addressReg;

    // OneEntry expects timeInterval as an array of pairs [[startISO, endISO]]; build a 1-hour slot [hour, hour+1).
    const hourMatch = typeof time === 'string' ? time.match(/^(\d{1,2})/) : null;
    const hour = hourMatch?.[1] ? parseInt(hourMatch[1], 10) : NaN;
    if (date && Number.isFinite(hour)) {
      const start = new Date(date);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      dispatch(
        addData({
          marker: 'delivery_time',
          type: 'timeInterval',
          value: [[start.toISOString(), end.toISOString()]],
          valid: true,
        })
      );
    }
    if (address) {
      dispatch(
        addData({
          marker: 'delivery_address',
          type: 'string',
          value: address,
          valid: true,
        })
      );
    }
  }, [cartDelivery, user, dispatch]);

  const productsCartData = useAppSelector(selectCartData) as IProducts[];

  const { data, isLoading } = useGetProductsByIdsQuery({
    items: productsCartData.map(p => p.id),
  });

  useEffect(() => {
    if (deliveryData) {
      dispatch(addDeliveryToCart(deliveryData));
    }
  }, [deliveryData]);

  // Drop stale ids from the persisted cart: products removed in OneEntry would otherwise spam 404s on every mount.
  useEffect(() => {
    if (!data) return;
    const returnedIds = new Set(data.map((p: IProductsEntity) => p.id));
    for (const entry of productsCartData) {
      if (!returnedIds.has(entry.id)) {
        dispatch(removeProduct(entry.id));
      }
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(data);

      // Subscribe to WS notifications about product price/status changes (authenticated users only).
      if (isAuth) {
        const ws = getApi().WS.connect();
        if (ws) {
          ws.on('notification', async res => {
            if (res?.product) {
              const product = {
                ...res.product,
                attributeValues: res.product?.attributes,
              };
              const index = data.findIndex((p: IProductsEntity) => p.id === product.id);
              const newPrice = parseInt(product?.attributeValues?.price?.value, 10);

              setProducts(prevProducts => {
                const newProducts = [...prevProducts];
                if (newProducts[index]) {
                  newProducts[index] = {
                    ...newProducts[index],
                    price: newPrice,
                    statusIdentifier: res?.product?.status?.identifier,
                  };
                }
                return newProducts;
              });
            }
          });

          return () => {
            ws.disconnect();
          };
        }
      }
    }
    return undefined;
  }, [data]);

  useEffect(() => {
    if (products) {
      dispatch(addProductsToCart(products));
    }
  }, [products]);

  // After auth completes (via the shared modal) - auto-advance to the order step if checkout was started here.
  useEffect(() => {
    if (pendingCheckout && isAuth) {
      dispatch(setStep('order'));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingCheckout(false);
    }
  }, [pendingCheckout, isAuth, dispatch]);

  // While RTK fetches product details, mirror the cart with one skeleton row per persisted item (delivery excluded).
  const pendingCount = productsCartData.filter(p => p.id !== DELIVERY_PRODUCT_ID).length;
  if (isLoading && pendingCount > 0) {
    return <CartListSkeleton count={Math.min(pendingCount, 8)} />;
  }

  // Delivery must not be rendered as a product card; drop entries without a stable id (defensive — keys must be unique).
  const visibleProducts = products.filter(
    (p: IProductsEntity) => typeof p?.id === 'number' && p.id !== DELIVERY_PRODUCT_ID
  );

  if (visibleProducts.length < 1) {
    return <EmptyCart />;
  }

  const onApply = () => {
    if (!isAuth) {
      setPendingCheckout(true);
      setComponent('AuthProviderSelect');
      setOpen(true);
      return;
    }
    // Reverse animation of cards before transitioning to order; on completion reset styles so a breadcrumb back nav restores them.
    const cards = document.querySelectorAll('.product-in-cart');
    const button = document.querySelectorAll('.cart-apply-btn');
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

  return (
    <div className="flex w-full flex-col overflow-hidden pb-5 lg:max-w-182.5">
      <CartAnimations className={'mb-4 flex w-full flex-col gap-4'} index={1}>
        {visibleProducts.map((product: IProductsEntity, i: number) => {
          // Lookup by id (not index) - RTK response order is not guaranteed, indexes drift out of sync.
          const cartEntry = productsCartData.find((p: { id: number }) => p.id === product.id);
          return (
            <ProductCard
              key={product.id}
              index={i}
              product={product}
              selected={cartEntry?.selected ?? false}
            />
          );
        })}
      </CartAnimations>
      <TableRowAnimations className={'mt-7.5 flex w-full'} index={5}>
        <button
          type="button"
          onClick={onApply}
          className="cart-apply-btn flex h-15 w-full items-center justify-center rounded-panel bg-custom_btnorange text-center font-normal text-base text-white hover_btn_transp md:h-11.25"
        >
          {isAuth ? 'APPLY' : t('login_to_continue', 'Sign in to continue')}
        </button>
      </TableRowAnimations>
    </div>
  );
};

export default CartPage;
