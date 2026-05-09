'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IOrderByMarkerEntity, IOrderProducts } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';

import type { BlogBanner } from '@/app/api';
import { getAllOrdersByMarker, useGetProductsByIdsQuery } from '@/app/api';
import { onSubscribeEvents } from '@/app/api/hooks/useEvents';
import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import {
  addProductToCart,
  increaseProductQty,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import { formatDate } from '@/app/utils/formatDate';
import OrdersAnimations from '@/components/profile/animations/OrdersAnimations';
import { setOrderReviewTarget } from '@/components/profile/orderReviewStore';
import { UsePrice } from '@/components/utils';

const HISTORY_STATUSES = new Set(['delivered', 'canceled', 'cancelled', 'completed', 'rejected']);

// md+ открывает корзину как страницу `/cart` (см. CartWizard) — Repeat order на десктопе ведёт туда же, не в drawer.
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

/** Читаемый статус заказа: локализованный из CMS, иначе human-readable из identifier. */
const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (o.statusLocalizeInfos as { title?: string } | undefined)?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '—';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
};

/** Заказ относится к "Orders History" (завершён/отменён), а не к "Active". */
const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  return HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase());
};

/**
 * Считает subtotal / delivery / discount / total для заказа.
 * `discount` = (subtotal + delivery) − serverTotal: если применялся купон, `totalSum` уже со скидкой.
 */
const computeTotals = (
  o: IOrderByMarkerEntity
): { subtotal: number; delivery: number; discount: number; total: number } => {
  let subtotal = 0;
  let delivery = 0;
  for (const p of o.products) {
    const line = Number(p.price) * Number(p.quantity);
    if (p.id === DELIVERY_PRODUCT_ID) delivery += line;
    else subtotal += line;
  }
  const serverTotal = Number(o.totalSum);
  const total = serverTotal || subtotal + delivery;
  const discount = serverTotal > 0 ? Math.max(0, subtotal + delivery - serverTotal) : 0;
  return { subtotal, delivery, discount, total };
};

/** Номер заказа `OE...` от SDK, иначе fallback на числовой id. */
const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

/** OrderCard — pill со сводкой заказа + раскрывающееся тело с позициями, итогами и CTA. */
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
  const { subtotal, delivery, discount, total } = computeTotals(order);
  const created = (order as unknown as { createdDate?: string }).createdDate;
  const canReview = (order.statusIdentifier ?? '').toLowerCase() === 'delivered';

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
      if (fullProduct?.statusIdentifier === 'out_of_stock') {
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
          .filter(p => productsById.get(p.id)?.statusIdentifier !== 'out_of_stock')
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
    <div className="orders-row">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-2.75 flex w-full items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base"
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
              className="order-body-row mt-5 block w-52.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-white hover_btn_transp"
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
                />
              ))}
            <div className="order-body-row mt-5 flex items-center justify-between rounded-[5px] border border-brand p-2.5">
              <div>
                <div className="flex gap-1.25 text-white">
                  <p>{t('subtotal_text', 'Subtotal:')}</p>
                  <p>{UsePrice({ amount: subtotal })}</p>
                </div>
                <div className="flex gap-1.25 text-brand">
                  <p>{t('delivery_text', 'Delivery:')}</p>
                  <p>{UsePrice({ amount: delivery })}</p>
                </div>
                {discount > 0 ? (
                  <div className="flex gap-1.25 text-brand">
                    <p>Discount:</p>
                    <p>−{UsePrice({ amount: discount })}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3.75 text-xl font-bold text-white">
                <p>{t('total_amount_text', 'Total Amount:')}</p>
                <p>{UsePrice({ amount: total })}</p>
              </div>
            </div>
            {(isHistory || canReview) && (
              <div className="order-body-row mt-5 flex flex-wrap gap-3.75">
                {isHistory && (
                  <button
                    type="button"
                    onClick={repeatOrder}
                    className="block w-32.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-white hover_btn_transp"
                  >
                    {t('repeat_order_button', 'Repeat order')}
                  </button>
                )}
                {canReview && (
                  <button
                    type="button"
                    onClick={openReviewPopup}
                    className="hover_btn_transp block rounded-[5px] border border-brand px-3.75 py-1.5 text-base text-brand"
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

/** OrderLineItem — одна строка позиции внутри раскрытого тела заказа. */
const OrderLineItem = ({
  product,
  first,
  fullProduct,
}: {
  product: IOrderProducts;
  first: boolean;
  fullProduct?: IProductsEntity | undefined;
}): JSX.Element => {
  const coverFromEntity = (
    fullProduct?.attributeValues?.cover?.value as { downloadLink?: string } | undefined
  )?.downloadLink;
  const previewSrc = product.previewImage?.previewLink ?? coverFromEntity ?? null;
  const href = '/shop/product/' + product.id;
  return (
    <div className={'order-body-row' + (first ? '' : ' mt-5')}>
      <div className="flex items-center justify-between gap-3.75">
        <Link href={href} aria-label={product.title} className="shrink-0">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={product.title}
              width={69}
              height={69}
              className="h-17.25 w-17.25 object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-17.25 w-17.25 shrink-0 rounded bg-custom_gray_pk"
            />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <Link href={href} className="text-sm font-normal text-white hover:text-brand">
            {product.title}
          </Link>
          <div className="flex items-center gap-2.5">
            <p className="text-xl font-bold text-brand">{UsePrice({ amount: product.price })}</p>
          </div>
        </div>
        <div className="flex h-11.25 w-8.75 items-center justify-center rounded-[5px] border border-white text-base font-normal text-white">
          x{product.quantity}
        </div>
      </div>
    </div>
  );
};

/** OrdersList — дашборд заказов: "Active orders" + "Orders History" + промо-сайдбар на md+. */
const OrdersList = ({
  promoBanners = [],
}: {
  promoBanners?: BlogBanner[];
} = {}): JSX.Element => {
  const t = useT();
  const { isAuth, isLoading: authLoading } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getAllOrdersByMarker({
        marker: 'delivery_order',
        offset: 0,
        limit: 50,
      });
      if (cancelled) return;
      if (res.isError) {
        setError(res.error?.message ?? 'Failed to load orders');
      } else {
        setOrders(res.orders ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  const { active, history } = useMemo(() => {
    const a: IOrderByMarkerEntity[] = [];
    const h: IOrderByMarkerEntity[] = [];
    orders.forEach(o => (isHistoryOrder(o) ? h.push(o) : a.push(o)));
    return { active: a, history: h };
  }, [orders]);

  const productIds = useMemo(() => {
    const set = new Set<number>();
    orders.forEach(o => o.products.forEach(p => set.add(p.id)));
    return Array.from(set);
  }, [orders]);
  const { data: fetchedProducts } = useGetProductsByIdsQuery(
    { items: productIds },
    { skip: productIds.length === 0 }
  );
  const productsById = useMemo(() => {
    const map = new Map<number, IProductsEntity>();
    (fetchedProducts ?? []).forEach(p => map.set(p.id, p));
    return map;
  }, [fetchedProducts]);

  useEffect(() => {
    if (active.length === 0 && history.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedIds(prev => {
      if (prev.size > 0) return prev;
      const next = new Set<number>();
      if (active[0]) next.add(active[0].id);
      if (history[0]) next.add(history[0].id);
      return next;
    });
  }, [active, history]);

  const toggle = (id: number): void => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Левая колонка зависит от состояния; правая (промо) рендерится на md+ всегда — 2-колоночный layout как в корзине.
  let leftColumn: JSX.Element;
  if (authLoading || loading) {
    leftColumn = (
      <div className="text-paper/80">{t('loading_orders_text', 'Loading orders...')}</div>
    );
  } else if (!isAuth) {
    // Inline-кнопка «sign in» внутри фразы из словаря: ищем подстроку (case-insensitive); если нет — кнопка после текста.
    const prompt = t('orders_signin_prompt', 'Please sign in to view your orders.');
    const signInLabel = t('sign_in_text', 'sign in');
    const idx = prompt.toLowerCase().indexOf(signInLabel.toLowerCase());
    const before = idx >= 0 ? prompt.slice(0, idx) : prompt + ' ';
    const after = idx >= 0 ? prompt.slice(idx + signInLabel.length) : '';
    leftColumn = (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        {before}
        <button
          type="button"
          onClick={() => {
            setComponent('AuthProviderSelect');
            setOpen(true);
          }}
          className="cursor-pointer text-brand underline underline-offset-2 hover:no-underline"
        >
          {signInLabel}
        </button>
        {after}
      </div>
    );
  } else if (error) {
    leftColumn = (
      <div className="rounded-xl bg-ink/60 p-6 text-paper/90">
        {t('orders_load_error_prefix', 'Unable to load orders:')} {error}
      </div>
    );
  } else if (orders.length === 0) {
    leftColumn = (
      <div className="flex flex-col items-center gap-5 rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        <p>{t('no_orders_text', 'You have no orders yet.')}</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-white hover_btn_transp"
        >
          {t('go_shopping_button', 'Go to shopping')}
        </Link>
      </div>
    );
  } else {
    leftColumn = (
      <>
        <p className="orders-row mt-2.5 text-xl text-paper">
          {t('active_orders_title', 'Active orders')}
        </p>
        {active.length === 0 ? (
          <p className="orders-row mt-2.75 text-sm text-paper/70">
            {t('no_active_orders_text', 'You have no active orders.')}
          </p>
        ) : (
          active.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expandedIds.has(o.id)}
              onToggle={() => toggle(o.id)}
              isHistory={false}
              productsById={productsById}
            />
          ))
        )}
        <p className="orders-row mt-5 text-xl text-paper">
          {t('orders_history_title', 'Orders History')}
        </p>
        {history.length === 0 ? (
          <p className="orders-row mt-2.75 text-sm text-paper/70">
            {t('no_history_orders_text', 'You have no past orders yet.')}
          </p>
        ) : (
          history.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expandedIds.has(o.id)}
              onToggle={() => toggle(o.id)}
              isHistory
              productsById={productsById}
            />
          ))
        )}
      </>
    );
  }

  return (
    <section>
      <OrdersAnimations rowsKey={active.length + history.length + promoBanners.length}>
        <div className="flex flex-col gap-10 md:flex-row md:gap-15">
          {/* `min-w-0` + `shrink-0` фиксируют 50/50 — без них flex-дети раскрытой позиции раздувают левую колонку. */}
          <div className="min-w-0 md:w-1/2 md:shrink-0">{leftColumn}</div>
          <aside className="hidden md:flex md:w-1/2 md:shrink-0 md:flex-col md:gap-10">
            {promoBanners
              .filter(b => b.mobileImage)
              .map(b => (
                <Link
                  key={b.id}
                  href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
                  title={b.title}
                  className="orders-row block overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
                >
                  <Image
                    src={b.mobileImage as string}
                    alt={b.title}
                    width={620}
                    height={240}
                    className="h-auto w-full"
                  />
                </Link>
              ))}
          </aside>
        </div>
      </OrdersAnimations>
    </section>
  );
};

export default OrdersList;
