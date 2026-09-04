'use client';

import type { IOrderData, IOrdersFormData } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi, isError } from '@/app/api/api/api';
import type { OrderWithStorage } from '@/app/api/server/orders/getAllOrdersAcrossStorages';
import {
  getAllOrdersAcrossStorages,
  isBookingStorageMarker,
} from '@/app/api/server/orders/getAllOrdersAcrossStorages';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { BOOKING_PRODUCT_ID, FORMS, ORDER_STATUSES } from '@/app/utils/constants';
import { setPendingReservationEdit } from '@/components/reservation/reservationEditState';
import Spinner from '@/components/shared/Spinner';

import ActiveBookingCard from './ActiveBookingCard';
import { formatOrderNumber, isHistoryOrder } from './bookingUtils';
import HistoryBookingCard from './HistoryBookingCard';

const CANCELLED_STATUS = ORDER_STATUSES.bookingCancelled;

/**
 * BookingsContent — Active reservation + Reservation History.
 *
 * @returns JSX of the bookings dashboard section.
 */
const BookingsContent = (): JSX.Element => {
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const t = useT();

  const [orders, setOrders] = useState<OrderWithStorage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit: pending -> side-channel, open ReservationPopup; submit will call `Orders.updateOrderByMarkerAndId` instead of `createOrder`.
  const onEdit = (order: OrderWithStorage) => {
    setPendingReservationEdit({
      orderId: order.id,
      formData: (order.formData as IOrdersFormData[] | undefined) ?? [],
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formIdentifier: order.formIdentifier ?? order.storageFormIdentifier ?? FORMS.bookingOrder,
    });
    setComponent('ReservationPopup');
    setOpen(true);
  };

  // Cancel: re-submit the order via `updateOrderByMarkerAndId` with `statusIdentifier`
  const onCancel = async (order: OrderWithStorage) => {
    const ok = window.confirm(
      t('booking_cancel_confirm', 'Cancel reservation #{id}?').replace(
        '{id}',
        formatOrderNumber(order)
      )
    );
    if (!ok) return;
    const existingFormData = (order.formData as IOrdersFormData[] | undefined) ?? [];
    const products =
      order.products.length > 0
        ? order.products.map(p => ({ productId: p.id, quantity: p.quantity }))
        : [{ productId: BOOKING_PRODUCT_ID, quantity: 1 }];
    const body: IOrderData & { statusIdentifier?: string } = {
      formIdentifier: order.formIdentifier ?? order.storageFormIdentifier ?? FORMS.bookingOrder,
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formData: existingFormData,
      products,
      statusIdentifier: CANCELLED_STATUS,
    };
    try {
      const res = await getApi().Orders.updateOrderByMarkerAndId(
        order.storageMarker ?? FORMS.bookingOrder,
        order.id,
        body
      );
      if (isError(res)) {
        toast(t('booking_cancel_failed', 'Failed to cancel reservation.'));
        return;
      }
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                statusIdentifier: CANCELLED_STATUS,
                statusLocalizeInfos: { title: t('reservation_status_canceled', 'Cancelled') },
              }
            : o
        )
      );
      toast(t('booking_cancelled_toast', 'Reservation cancelled.'));
    } catch {
      toast(t('booking_cancel_failed', 'Failed to cancel reservation.'));
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // Mark "loading" synchronously before the async bookings fetch starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getAllOrdersAcrossStorages({ offset: 0, limit: 50 })
      .then(res => {
        if (cancelled) return;
        setOrders(res.orders.filter(o => isBookingStorageMarker(o.storageMarker)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { active, history } = useMemo(() => {
    const a: OrderWithStorage[] = [];
    const h: OrderWithStorage[] = [];
    for (const o of orders) {
      (isHistoryOrder(o) ? h : a).push(o);
    }
    return { active: a, history: h };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {active.length === 0 ? (
        <p className="profile-anim-row text-center text-base text-paper/80">
          {t('no_active_reservations', 'You have no active reservations.')}
        </p>
      ) : (
        active.map(o => (
          <ActiveBookingCard
            key={o.id}
            order={o}
            onCancel={() => onCancel(o)}
            onEdit={() => onEdit(o)}
          />
        ))
      )}

      <p className="profile-anim-row mt-2.5 text-center text-xl font-bold tracking-fine text-brand">
        {t('reservation_history_title', 'Reservation History')}
      </p>

      {history.length === 0 ? (
        <p className="profile-anim-row text-center text-base text-paper/80">
          {t('no_reservation_history', 'No past reservations yet.')}
        </p>
      ) : (
        <div className="flex flex-col gap-3.75">
          {history.map(o => (
            <HistoryBookingCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsContent;
