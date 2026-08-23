'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IOrderByMarkerEntity, IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';

import type { OrderWithStorage } from '@/app/api';
import {
  getAllOrdersAcrossStorages,
  isBookingStorageMarker,
  useGetProductsByIdsQuery,
} from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import OrdersAnimations from '@/components/profile/animations/OrdersAnimations';
import type { BlogBanner } from '@/components/promo/blogBanner';

import OrderCard from './OrderCard';
import { isHistoryOrder } from './orderUtils';

/**
 * OrdersList — orders dashboard: "Active orders" + "Orders History" + promo sidebar on md+.
 *
 * @param   {object}         [props]                   - Component props.
 * @param   {BlogBanner[]}   [props.promoBanners]      - Promo banners rendered in the right column on md+.
 * @param   {boolean}        [props.disableAnimations] - Skips the internal `OrdersAnimations` wrapper so a parent (e.g. the mobile ProfilePopup) can drive entry/exit on `.profile-anim-row` elements itself, avoiding double-animation.
 * @returns JSX of the orders dashboard section.
 */
const OrdersList = ({
  promoBanners = [],
  disableAnimations = false,
}: {
  promoBanners?: BlogBanner[];
  disableAnimations?: boolean;
} = {}): JSX.Element => {
  const t = useT();
  const { isAuth, isLoading: authLoading } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const [orders, setOrders] = useState<OrderWithStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuth) {
      // Reset-on-prop-change: a guest has no orders to load — the spinner must stop
      // synchronously before the early return skips the async fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // All order-storages except the booking one — a new order-type storage shows up automatically.
      const res = await getAllOrdersAcrossStorages({ offset: 0, limit: 50 });
      if (cancelled) return;
      if (res.isError) {
        setError(res.error?.message ?? 'Failed to load orders');
      } else {
        setOrders(res.orders.filter(o => !isBookingStorageMarker(o.storageMarker)));
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
    // Sync-with-async-data: auto-expand the first active/history order once the fetch lands (no-op afterwards).
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

  // The left column depends on state; the right one (promo) always renders on md+ - same 2-column layout as the cart.
  let leftColumn: JSX.Element;
  if (authLoading || loading) {
    leftColumn = (
      <div className="text-paper/80">{t('loading_orders_text', 'Loading orders...')}</div>
    );
  } else if (!isAuth) {
    // Inline "sign in" button inside the dictionary phrase: search for the substring (case-insensitive); if not found - render the button after the text.
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
          className="cursor-pointer text-brand underline underline-offset-2 transition-all duration-200 hover:no-underline"
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
          className="hover_btn_transp inline-flex items-center justify-center rounded-card bg-brand px-3.75 py-1.5 text-base text-white"
        >
          {t('go_shopping_button', 'Go to shopping')}
        </Link>
      </div>
    );
  } else {
    leftColumn = (
      <>
        <p className="orders-row profile-anim-row text-xl text-paper">
          {t('active_orders_title', 'Active orders')}
        </p>
        {active.length === 0 ? (
          <p className="orders-row profile-anim-row mt-2.75 text-sm text-paper/70">
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
        <p className="orders-row profile-anim-row mt-5 text-xl text-paper">
          {t('orders_history_title', 'Orders History')}
        </p>
        {history.length === 0 ? (
          <p className="orders-row profile-anim-row mt-2.75 text-sm text-paper/70">
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

  // `min-w-0` + `shrink-0` lock the 50/50 split - without them, flex children of an expanded item inflate the left column.
  const grid = (
    <div className="flex flex-col gap-10 md:flex-row md:gap-15">
      <div className="min-w-0 md:w-1/2 md:shrink-0">{leftColumn}</div>
      <aside className="hidden md:flex md:w-1/2 md:shrink-0 md:flex-col md:gap-10">
        {promoBanners
          .filter(b => b.mobileImage)
          .map(b => (
            <Link
              key={b.id}
              href={b.pageUrl ? `/promotions/${b.pageUrl}` : '#'}
              title={b.title}
              className="orders-row profile-anim-row block overflow-hidden transition-transform duration-500 hover:scale-102"
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
  );

  return (
    <section>
      {disableAnimations ? (
        grid
      ) : (
        <OrdersAnimations rowsKey={active.length + history.length + promoBanners.length}>
          {grid}
        </OrdersAnimations>
      )}
    </section>
  );
};

export default OrdersList;
