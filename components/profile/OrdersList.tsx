'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import ChevronUpIcon from '@/components/icons/chevron-up.svg';

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
 * Human-readable label for an order `statusIdentifier`.
 * @param   {string | undefined} status - Raw status identifier from SDK.
 * @returns {string}                    Display label.
 */
const statusLabel = (status: string | undefined): string => {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};

/**
 * Orders list — row-layout per `pk_active_orders.html`: each order is a
 * gray pill with bold order number, status in the middle, date on the right,
 * chevron icon.
 *
 * Fetches from `orders` storage marker via `getAllOrdersByMarker`. Falls
 * back gracefully to explanatory empty/error states.
 * @returns {JSX.Element} Orders list JSX.
 */
const OrdersList = (): JSX.Element => {
  const { isAuth, isLoading: authLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <>
      <p className="text-[16px] text-[#969696]">Cart</p>
      <p className="mt-2.5 text-[20px] text-paper">Active orders</p>
      <ul className="mt-2.75 flex flex-col gap-4">
        {orders.map((o) => {
          const displayNo =
            (o as unknown as { orderId?: string }).orderId ?? String(o.id);
          const created =
            (o as unknown as { createdDate?: string }).createdDate ??
            (o as unknown as { statusIdentifierSetDate?: string })
              .statusIdentifierSetDate;
          return (
            <li
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-3.75 py-1.5 text-[14px] text-white lg:text-[16px]"
            >
              <p className="font-bold">№{displayNo}</p>
              <p>{statusLabel(o.statusIdentifier as string | undefined)}</p>
              <p>{formatOrderDate(created)}</p>
              <ChevronUpIcon />
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default OrdersList;
