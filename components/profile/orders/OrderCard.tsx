'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents } from '@/app/api/hooks/useEvents';
import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useIsMdUp } from '@/app/hooks/useIsMdUp';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { useOutOfStockMarker } from '@/app/store/providers/ProductStatusContext';
import {
  addProductToCart,
  increaseProductQty,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import { DELIVERY_PRODUCT_ID, ORDER_STATUSES } from '@/app/utils/constants';
import { formatDate } from '@/app/utils/formatDate';
import { setOrderReviewTarget } from '@/components/profile/orderReviewStore';
import { UsePrice } from '@/components/utils';

import OrderLineItem from './OrderLineItem';
import { computeTotals, formatOrderNumber, statusLabel } from './orderUtils';

/**
 * OrderCard — pill with the order summary + expandable body with line items, totals, and CTA.
 *
 * @param   {object}                          props              - Component props.
 * @param   {IOrderByMarkerEntity}            props.order        - OneEntry order entity.
 * @param   {boolean}                         props.expanded     - Whether the body is currently expanded.
 * @param   {() => void}                      props.onToggle     - Toggles the expanded state.
 * @param   {boolean}                         props.isHistory    - Whether the order belongs to history (controls available actions).
 * @param   {Map<number, IProductsEntity>}    props.productsById - Map of full product entities used to enrich line items.
 * @returns JSX of the order card.
 */
const OrderCard = ({
  order,
  expanded,
  onToggle,
  isHistory,
  productsById,
}: {
  order: IOrderByMarkerEntity;
  expanded: boolean;
  onToggle: () => void;
  isHistory: boolean;
  productsById: Map<number, IProductsEntity>;
}): JSX.Element => {
  const t = useT();
  const router = useRouter();
  const isMdUp = useIsMdUp();
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartData);
  const favoritesIds = useAppSelector(selectFavoritesItems);
  const { user } = useContext(AuthContext);
  const outOfStockMarker = useOutOfStockMarker();
  const { subtotal, delivery, discount, total } = computeTotals(order);
  const created = (order as unknown as { createdDate?: string }).createdDate;
  const canReview = (order.statusIdentifier ?? '').toLowerCase() === ORDER_STATUSES.delivered;

  const bodyRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(expanded);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (expanded) setRendered(true);
  }, [expanded]);

  useGSAP(
    () => {
      if (!bodyRef.current) return undefined;
      const targets = bodyRef.current.querySelectorAll('.order-body-row');
      if (targets.length === 0) return undefined;

      if (expanded && rendered) {
        const tl = gsap.timeline();
        tl.set(targets, { autoAlpha: 0, yPercent: 100 }).to(targets, {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.35,
          stagger: 0.06,
        });
        return () => {
          tl.kill();
        };
      }
      if (!expanded && rendered) {
        const tl = gsap.timeline({
          onComplete: () => setRendered(false),
        });
        tl.to(targets, {
          autoAlpha: 0,
          yPercent: 100,
          duration: 0.3,
          stagger: { each: 0.05, from: 'end' },
        });
        return () => {
          tl.kill();
        };
      }
      return undefined;
    },
    { scope: bodyRef, dependencies: [expanded, rendered] }
  );

  const openReviewPopup = (): void => {
    setOrderReviewTarget({ order, productsById });
    setComponent('OrderReviewPopup');
    setOpen(true);
  };

  const openContactCourier = (): void => {
    setComponent('ContactUsForm');
    setOpen(true);
  };

  const repeatOrder = async (): Promise<void> => {
    const inCartIds = new Set(cartItems.map(c => c.id));
    const skipped: string[] = [];
    const addedItems: { id: number; quantity: number; selected: boolean }[] = cartItems.map(c => ({
      id: c.id,
      quantity: c.quantity,
      selected: c.selected,
    }));

    for (const p of order.products) {
      const fullProduct = productsById.get(p.id);
      if (fullProduct?.statusIdentifier === outOfStockMarker) {
        skipped.push(p.title);
        continue;
      }
      const qty = Number(p.quantity) || 1;
      if (inCartIds.has(p.id)) {
        dispatch(increaseProductQty({ id: p.id, quantity: qty, units: 0 }));
        const idx = addedItems.findIndex(i => i.id === p.id);
        const existing = idx >= 0 ? addedItems[idx] : undefined;
        if (existing) {
          addedItems[idx] = { ...existing, quantity: existing.quantity + qty };
        }
      } else {
        dispatch(addProductToCart({ id: p.id, quantity: qty, selected: true }));
        addedItems.push({ id: p.id, quantity: qty, selected: true });
        inCartIds.add(p.id);
      }
    }

    if (addedItems.length === cartItems.length && skipped.length === order.products.length) {
      toast(t('repeat_order_all_unavailable', 'All items from this order are out of stock'));
      return;
    }

    toast(t('repeat_order_added_text', 'Items from your previous order added to cart'));

    if (user) {
      await updateUserState({ favorites: favoritesIds, cart: addedItems, user });
      await Promise.all(
        order.products
          .filter(p => productsById.get(p.id)?.statusIdentifier !== outOfStockMarker)
          .map(p => onSubscribeEvents(p.id))
      );
    }

    dispatch(setStep('cart'));
    if (isMdUp) {
      router.push('/cart');
    } else {
      setComponent('CartPopup');
      setOpen(true);
    }
  };

  return (
    <div className="orders-row profile-anim-row">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-2.75 flex w-full items-center justify-between gap-2 rounded-card bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base"
      >
        <p className="font-bold">№{formatOrderNumber(order)}</p>
        <p>{statusLabel(order)}</p>
        <p>{formatDate(created)}</p>
        <Image
          src="/images/icons/chevron-up.svg"
          alt=""
          width={12}
          height={7}
          className={'transition-transform duration-200 ' + (expanded ? '' : 'rotate-180')}
        />
      </button>
      {rendered && (
        <div ref={bodyRef}>
          {!isHistory && (
            <button
              type="button"
              onClick={openContactCourier}
              className="order-body-row hover_btn_transp mt-5 block w-52.5 rounded-card bg-brand px-3.75 py-1.5 text-base text-white"
            >
              {t('contact_courier_button', 'Contact with the courier')}
            </button>
          )}
          <div className="mt-5 flex flex-col">
            {order.products
              .filter(p => p.id !== DELIVERY_PRODUCT_ID)
              .map((p, idx) => (
                <OrderLineItem
                  key={`${p.id}-${idx}`}
                  product={p}
                  first={idx === 0}
                  fullProduct={productsById.get(p.id)}
                  currency={order.currency}
                />
              ))}
            <div className="order-body-row mt-5 flex items-center justify-between rounded-card border border-brand p-2.5">
              <div>
                <div className="flex gap-1.25 text-white">
                  <p>{t('subtotal_text', 'Subtotal:')}</p>
                  <p>{UsePrice({ amount: subtotal, currency: order.currency })}</p>
                </div>
                <div className="flex gap-1.25 text-brand">
                  <p>{t('delivery_text', 'Delivery:')}</p>
                  <p>{UsePrice({ amount: delivery, currency: order.currency })}</p>
                </div>
                {discount > 0 ? (
                  <div className="flex gap-1.25 text-brand">
                    <p>Discount:</p>
                    <p>−{UsePrice({ amount: discount, currency: order.currency })}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3.75 text-xl font-bold text-white">
                <p>{t('total_amount_text', 'Total Amount:')}</p>
                <p>{UsePrice({ amount: total, currency: order.currency })}</p>
              </div>
            </div>
            {(isHistory || canReview) && (
              <div className="order-body-row mt-5 flex flex-wrap gap-3.75">
                {isHistory && (
                  <button
                    type="button"
                    onClick={repeatOrder}
                    className="hover_btn_transp block w-32.5 rounded-card bg-brand px-3.75 py-1.5 text-base text-white"
                  >
                    {t('repeat_order_button', 'Repeat order')}
                  </button>
                )}
                {canReview && (
                  <button
                    type="button"
                    onClick={openReviewPopup}
                    className="hover_btn_transp block rounded-card border border-brand px-3.75 py-1.5 text-base text-brand"
                  >
                    {t('leave_review_button', 'Leave a review')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
