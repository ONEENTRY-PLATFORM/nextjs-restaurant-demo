'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';

/**
 * Orders list — client-side fetch of user orders from storage marker `orders`.
 * Requires authentication; falls back to empty state when not signed in.
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
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li
          key={o.id}
          className="rounded-xl bg-ink/60 p-5 flex items-center justify-between gap-4"
        >
          <div className="flex flex-col">
            <span className="text-sm text-paper/60">
              Order #{o.id}
              {o.createdDate ? ` · ${String(o.createdDate).slice(0, 10)}` : ''}
            </span>
            <span className="font-bold text-brand text-lg">
              {(o.statusIdentifier as string) ?? '—'}
            </span>
          </div>
          <span className="font-bold text-paper text-xl">
            {(o as unknown as { totalSum?: number }).totalSum ?? ''}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default OrdersList;
