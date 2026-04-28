'use client';

import Image from 'next/image';
import type {
  IOrderByMarkerEntity,
  IOrderProducts,
} from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import ChevronUpIcon from '@/components/icons/chevron-up.svg';
import { UsePrice } from '@/components/utils';

const HISTORY_STATUSES = new Set([
  'delivered',
  'canceled',
  'cancelled',
  'completed',
  'rejected',
]);

const PROMO_BANNERS = [
  { src: '/images/promo/Deal of the Day pk.png', alt: 'Deal of the Day -50%' },
  { src: '/images/promo/Happy Birthday pk.png', alt: '25% Off Happy Birthday' },
  { src: '/images/promo/Business Lunch pk.png', alt: 'Business Lunch 1-3 p.m' },
];

/**
 * Format an ISO / ms date as `dd.MM.yy` per `pk_active_orders.html`.
 * @param   {string | number | Date | undefined} when - Input date value.
 * @returns {string}                                    Formatted stamp or empty string.
 */
const formatOrderDate = (when: string | number | Date | undefined): string => {
  if (!when) return '';
  const d = new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(
    d.getFullYear(),
  ).slice(2)}`;
};

/**
 * Resolve a human-readable order status, preferring localized info from CMS.
 * @param   {IOrderByMarkerEntity} o - Order entity.
 * @returns {string}                  Display label.
 */
const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (
    o.statusLocalizeInfos as { title?: string } | undefined
  )?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '—';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};

/**
 * Whether an order should be grouped under "Orders History" rather than
 * "Active orders".
 * @param   {IOrderByMarkerEntity} o - Order entity.
 * @returns {boolean}                 True if the order is finished / cancelled.
 */
const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  return HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase());
};

/**
 * Compute subtotal / delivery / total for an order. Subtotal is the sum of
 * line items; delivery is the residual between order `totalSum` and the
 * subtotal (clamped at 0).
 * @param   {IOrderByMarkerEntity} o - Order entity.
 * @returns {{ subtotal: number; delivery: number; total: number }} Totals.
 */
const computeTotals = (
  o: IOrderByMarkerEntity,
): { subtotal: number; delivery: number; total: number } => {
  const subtotal = o.products.reduce(
    (s, p) => s + Number(p.price) * Number(p.quantity),
    0,
  );
  const total = Number(o.totalSum) || subtotal;
  const delivery = Math.max(0, total - subtotal);
  return { subtotal, delivery, total };
};

/**
 * Format the order number as shown in static-html (`№OE...`). Falls back to
 * the raw numeric id if the SDK does not provide a formatted code.
 * @param   {IOrderByMarkerEntity} o - Order entity.
 * @returns {string}                  Display number.
 */
const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

/**
 * Single row: pill with order summary + collapsible body with line items,
 * totals, and CTA. Mirrors `pk_active_orders.html`.
 * @param   {object}              props          - Card props.
 * @param   {IOrderByMarkerEntity} props.order   - Order entity.
 * @param   {boolean}             props.expanded - Whether the body is open.
 * @param   {() => void}          props.onToggle - Toggle handler.
 * @param   {boolean}             props.isHistory- Whether to render the
 *                                                 history-only Repeat CTA
 *                                                 (vs. the active "Contact
 *                                                 with the courier" CTA).
 * @returns {JSX.Element}                         Card JSX.
 */
const OrderCard = ({
  order,
  expanded,
  onToggle,
  isHistory,
}: {
  order: IOrderByMarkerEntity;
  expanded: boolean;
  onToggle: () => void;
  isHistory: boolean;
}): JSX.Element => {
  const { subtotal, delivery, total } = computeTotals(order);
  const created = (order as unknown as { createdDate?: string }).createdDate;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-2.75 flex w-full items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base"
      >
        <p className="font-bold">№{formatOrderNumber(order)}</p>
        <p>{statusLabel(order)}</p>
        <p>{formatOrderDate(created)}</p>
        <ChevronUpIcon
          className={
            'transition-transform duration-200 ' +
            (expanded ? '' : 'rotate-180')
          }
        />
      </button>
      {expanded && (
        <>
          {!isHistory && (
            <button
              type="button"
              className="mt-5 block w-52.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-ink hover_btn_transp"
            >
              Contact with the courier
            </button>
          )}
          <div className="mt-5 flex flex-col">
            {order.products.map((p, idx) => (
              <OrderLineItem
                key={`${p.id}-${idx}`}
                product={p}
                first={idx === 0}
              />
            ))}
            <div className="mt-5 flex items-center justify-between rounded-[5px] border border-brand p-2.5">
              <div>
                <div className="flex gap-1.25 text-white">
                  <p>Subtotal:</p>
                  <p>{UsePrice({ amount: subtotal })}</p>
                </div>
                <div className="flex gap-1.25 text-brand">
                  <p>Delivery:</p>
                  <p>{UsePrice({ amount: delivery })}</p>
                </div>
              </div>
              <div className="flex gap-3.75 text-xl font-bold text-white">
                <p>Total Amount:</p>
                <p>{UsePrice({ amount: total })}</p>
              </div>
            </div>
            {isHistory && (
              <button
                type="button"
                className="mt-5 block w-32.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-ink hover_btn_transp"
              >
                Repeat order
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * One item row inside the expanded order body.
 * @param   {object}         props         - Row props.
 * @param   {IOrderProducts} props.product - Order line item.
 * @param   {boolean}        props.first   - Whether this is the first row
 *                                           (no top margin).
 * @returns {JSX.Element}                  Row JSX.
 */
const OrderLineItem = ({
  product,
  first,
}: {
  product: IOrderProducts;
  first: boolean;
}): JSX.Element => {
  const previewSrc = product.previewImage?.previewLink ?? null;
  return (
    <div
      className={
        'flex items-center justify-between gap-3.75 ' + (first ? '' : 'mt-5')
      }
    >
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
      <div className="flex w-55 flex-col justify-between lg:w-97.5 xl:w-122.5">
        <p className="text-sm font-normal text-white">{product.title}</p>
        <div className="flex items-center gap-2.5">
          <p className="text-xl font-bold text-brand">
            {UsePrice({ amount: product.price })}
          </p>
        </div>
      </div>
      <div className="flex h-11.25 w-8.75 items-center justify-center rounded-[5px] border border-white text-base font-normal text-white">
        x{product.quantity}
      </div>
    </div>
  );
};

/**
 * Orders dashboard view — splits the user's orders into "Active orders" and
 * "Orders History", with a desktop-only promo sidebar. Mirrors the layout in
 * `static-html/pk_active_orders.html`.
 *
 * Fetches via `delivery_order` storage marker; falls back gracefully on auth /
 * empty / error states.
 * @returns {JSX.Element} Orders list JSX.
 */
const OrdersList = (): JSX.Element => {
  const { isAuth, isLoading: authLoading } = useContext(AuthContext);
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
    orders.forEach((o) => (isHistoryOrder(o) ? h.push(o) : a.push(o)));
    return { active: a, history: h };
  }, [orders]);

  useEffect(() => {
    if (active.length === 0 && history.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set<number>();
      if (active[0]) next.add(active[0].id);
      if (history[0]) next.add(history[0].id);
      return next;
    });
  }, [active, history]);

  const toggle = (id: number): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (authLoading || loading) {
    return <div className="text-paper/80">Loading orders...</div>;
  }
  if (!isAuth) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        Please sign in to view your orders.
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-paper/90">
        Unable to load orders: {error}
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        You have no orders yet.
      </div>
    );
  }

  return (
    <section>
      <p className="text-base text-[#969696]">Cart</p>
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-15">
        <div className="lg:w-1/2">
          <p className="mt-2.5 text-xl text-paper">Active orders</p>
          {active.length === 0 ? (
            <p className="mt-2.75 text-sm text-paper/70">
              You have no active orders.
            </p>
          ) : (
            active.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                expanded={expandedIds.has(o.id)}
                onToggle={() => toggle(o.id)}
                isHistory={false}
              />
            ))
          )}
          <p className="mt-5 text-xl text-paper">Orders History</p>
          {history.length === 0 ? (
            <p className="mt-2.75 text-sm text-paper/70">
              You have no past orders yet.
            </p>
          ) : (
            history.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                expanded={expandedIds.has(o.id)}
                onToggle={() => toggle(o.id)}
                isHistory
              />
            ))
          )}
        </div>
        <aside className="hidden lg:flex lg:w-1/2 lg:flex-col lg:gap-10">
          {PROMO_BANNERS.map((b) => (
            <Image
              key={b.src}
              src={b.src}
              alt={b.alt}
              width={620}
              height={240}
              className="h-auto w-full"
            />
          ))}
        </aside>
      </div>
    </section>
  );
};

export default OrdersList;
