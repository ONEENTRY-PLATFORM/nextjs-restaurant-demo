'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';

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
        marker: 'orders',
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
      <p className="mt-[10px] text-[20px] text-paper">Active orders</p>
      <ul className="mt-[11px] flex flex-col gap-4">
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
              className="flex items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-[15px] py-[6px] text-[14px] text-white lg:text-[16px]"
            >
              <p className="font-bold">№{displayNo}</p>
              <p>{statusLabel(o.statusIdentifier as string | undefined)}</p>
              <p>{formatOrderDate(created)}</p>
              <svg
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5.28915 0.290001L0.289148 5.29C0.195909 5.38324 0.121949 5.49393 0.0714883 5.61575C0.021028 5.73757 -0.0049439 5.86814 -0.00494389 6C-0.00494388 6.2663 0.100844 6.5217 0.289148 6.71C0.382386 6.80324 0.493077 6.8772 0.614899 6.92766C0.736721 6.97812 0.867289 7.00409 0.999148 7.00409C1.26545 7.00409 1.52084 6.8983 1.70915 6.71L5.99915 2.41L10.2891 6.71C10.3821 6.80373 10.4927 6.87812 10.6146 6.92889C10.7364 6.97966 10.8671 7.0058 10.9991 7.0058C11.1312 7.0058 11.2619 6.97966 11.3837 6.92889C11.5056 6.87812 11.6162 6.80373 11.7091 6.71C11.8029 6.61704 11.8773 6.50644 11.928 6.38458C11.9788 6.26272 12.0049 6.13201 12.0049 6C12.0049 5.86799 11.9788 5.73728 11.928 5.61542C11.8773 5.49356 11.8029 5.38296 11.7091 5.29L6.70915 0.290001C6.61618 0.196272 6.50558 0.121876 6.38372 0.0711076C6.26187 0.0203387 6.13116 -0.00579861 5.99915 -0.0057986C5.86714 -0.0057986 5.73643 0.0203388 5.61457 0.0711076C5.49271 0.121876 5.38211 0.196272 5.28915 0.290001Z"
                  fill="#EC722B"
                />
              </svg>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default OrdersList;
