'use client';

import type { IOrderByMarkerEntity, IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { formatDate } from '@/app/utils/formatDate';
import { setPendingReservationEdit } from '@/components/reservation/reservationEditState';
import Loader from '@/components/shared/Spinner';

const HISTORY_STATUSES = new Set(['delivered', 'canceled', 'cancelled', 'completed', 'rejected']);

const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  return HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase());
};

const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (o.statusLocalizeInfos as { title?: string } | undefined)?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '—';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
};

/**
 * BookingsContent — Active reservation + Reservation History.
 * Data: `getAllOrdersByMarker({ marker: 'booking_order' })` (same storage marker as in `ReservationForm`).
 */
const BookingsContent = (): JSX.Element => {
  const { setComponent } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const t = useT();

  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit: pending → side-channel, open ReservationPopup; submit will call `Orders.updateOrderByMarkerAndId` instead of `createOrder`.
  const onEdit = (order: IOrderByMarkerEntity) => {
    if (!order.formIdentifier) {
      toast(t('booking_edit_unavailable', 'This booking cannot be edited.'));
      return;
    }
    setPendingReservationEdit({
      orderId: order.id,
      formData: (order.formData as IOrdersFormData[] | undefined) ?? [],
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formIdentifier: order.formIdentifier,
    });
    setComponent('ReservationPopup');
  };

  // Cancel: SDK does not allow changing `statusIdentifier` from the client (MISMATCH-LOG §C.10) — optimistic removal + toast.
  const onCancel = (order: IOrderByMarkerEntity) => {
    const ok = window.confirm(
      t('booking_cancel_confirm', 'Cancel reservation #{id}?').replace(
        '{id}',
        formatOrderNumber(order)
      )
    );
    if (!ok) return;
    setOrders(prev => prev.filter(o => o.id !== order.id));
    toast(t('booking_cancel_toast', 'Cancellation request received. We will contact you shortly.'));
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    getAllOrdersByMarker({ marker: 'booking_order', offset: 0, limit: 50 })
      .then(res => {
        if (cancelled) return;
        setOrders(res.orders ?? []);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { active, history } = useMemo(() => {
    const a: IOrderByMarkerEntity[] = [];
    const h: IOrderByMarkerEntity[] = [];
    for (const o of orders) {
      (isHistoryOrder(o) ? h : a).push(o);
    }
    return { active: a, history: h };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {active.length === 0 ? (
        <p className="text-center text-base text-paper/80">You have no active reservations.</p>
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

      <p className="mt-2.5 text-center font-bold text-[20px] tracking-[0.02em] text-brand">
        Reservation History
      </p>

      {history.length === 0 ? (
        <p className="text-center text-base text-paper/80">No past reservations yet.</p>
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

const ActiveBookingCard = ({
  order,
  onCancel,
  onEdit,
}: {
  order: IOrderByMarkerEntity;
  onCancel: () => void;
  onEdit: () => void;
}): JSX.Element => {
  const dateRaw = (order.createdDate ??
    (order as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  const date = dateRaw ? formatDate(dateRaw) : '';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-[5px] border border-brand px-3.75 py-1.25">
        <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
        <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
        <p className="font-normal text-base text-paper">{date}</p>
      </div>
      <div className="flex items-center justify-between gap-3.75">
        <button
          type="button"
          onClick={onCancel}
          className="hover_btn_white flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-paper text-base text-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="hover_btn_white flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-brand text-base text-brand"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

const HistoryBookingCard = ({ order }: { order: IOrderByMarkerEntity }): JSX.Element => {
  const dateRaw = (order.createdDate ??
    (order as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  const date = dateRaw ? formatDate(dateRaw) : '';
  return (
    <div className="flex items-center justify-between rounded-[5px] border border-paper px-3.75 py-1.25">
      <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
      <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
      <p className="font-normal text-base text-paper">{date}</p>
    </div>
  );
};

export default BookingsContent;
