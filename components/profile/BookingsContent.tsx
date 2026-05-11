'use client';

import type {
  IOrderByMarkerEntity,
  IOrderData,
  IOrdersFormData,
} from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getAllOrdersByMarker, getApi, isError } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { formatDate } from '@/app/utils/formatDate';
import { setPendingReservationEdit } from '@/components/reservation/reservationEditState';
import Loader from '@/components/shared/Spinner';

const CANCELLED_STATUS = 'booking_cancelled';
const BOOKING_PLACEHOLDER_PRODUCT_ID = 34;
const HISTORY_STATUS_KEYWORDS = ['cancel', 'complet', 'deliver', 'reject', 'refund'];

/**
 * isHistoryOrder — whether the booking order is in history (completed/cancelled/rejected/refunded).
 *
 * Matches by substring so that admin-specific markers like `booking_cancelled` and
 * `booking_completed` are recognised alongside the generic ones (`canceled`, `delivered`, …).
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `true` when the booking belongs to history.
 */
const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  const id = (o.statusIdentifier ?? '').toLowerCase();
  if (!id) return false;
  return HISTORY_STATUS_KEYWORDS.some(k => id.includes(k));
};

/**
 * formatOrderNumber — order number `OE…` from the SDK, otherwise fallback to the numeric id.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Display order number string.
 */
const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

/**
 * statusLabel — human-readable booking status (localized from CMS, otherwise derived from the identifier).
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Localized status title or a humanised identifier (`-` when nothing is set).
 */
const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (o.statusLocalizeInfos as { title?: string } | undefined)?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '-';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase());
};

/**
 * BookingsContent — Active reservation + Reservation History.
 *
 * Data: `getAllOrdersByMarker({ marker: 'booking_order' })` (same storage marker as in `ReservationForm`).
 *
 * @returns JSX of the bookings dashboard section.
 */
const BookingsContent = (): JSX.Element => {
  const { setComponent } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const t = useT();

  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit: pending -> side-channel, open ReservationPopup; submit will call `Orders.updateOrderByMarkerAndId` instead of `createOrder`.
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

  // Cancel: re-submit the order via `updateOrderByMarkerAndId` with `statusIdentifier`
  // overridden to the admin-configured cancellation marker. The SDK's `IOrderData` does
  // not type `statusIdentifier`, but the underlying PUT accepts it (verified against the
  // live project). After success the order's status flips client-side so `isHistoryOrder`
  // routes it into Reservation History without a refetch.
  const onCancel = async (order: IOrderByMarkerEntity) => {
    const ok = window.confirm(
      t('booking_cancel_confirm', 'Cancel reservation #{id}?').replace(
        '{id}',
        formatOrderNumber(order)
      )
    );
    if (!ok) return;
    if (!order.formIdentifier) {
      toast(t('booking_cancel_unavailable', 'This booking cannot be cancelled.'));
      return;
    }
    const existingFormData = (order.formData as IOrdersFormData[] | undefined) ?? [];
    const products =
      order.products.length > 0
        ? order.products.map(p => ({ productId: p.id, quantity: p.quantity }))
        : [{ productId: BOOKING_PLACEHOLDER_PRODUCT_ID, quantity: 1 }];
    const body: IOrderData & { statusIdentifier?: string } = {
      formIdentifier: order.formIdentifier,
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formData: existingFormData,
      products,
      statusIdentifier: CANCELLED_STATUS,
    };
    try {
      const res = await getApi().Orders.updateOrderByMarkerAndId(
        'booking_order',
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

      <p className="mt-2.5 text-center font-bold text-xl tracking-fine text-brand">
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

/**
 * ActiveBookingCard — active booking row with Cancel / Edit actions.
 *
 * @param   {object}                 props          - Component props.
 * @param   {IOrderByMarkerEntity}   props.order    - OneEntry booking order entity.
 * @param   {() => void}             props.onCancel - Cancellation handler.
 * @param   {() => void}             props.onEdit   - Edit handler that opens the reservation popup.
 * @returns JSX of the active booking row.
 */
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
      <div className="flex items-center justify-between rounded-card border border-brand px-3.75 py-1.25">
        <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
        <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
        <p className="font-normal text-base text-paper">{date}</p>
      </div>
      <div className="flex items-center justify-between gap-3.75">
        <button
          type="button"
          onClick={onCancel}
          className="hover_btn_paper flex h-8.75 w-23.75 items-center justify-center rounded-card border border-paper text-base text-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="hover_btn_brand flex h-8.75 w-23.75 items-center justify-center rounded-card border border-brand text-base text-brand"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

/**
 * HistoryBookingCard — read-only past booking row (number / status / date).
 *
 * @param   {object}                 props       - Component props.
 * @param   {IOrderByMarkerEntity}   props.order - OneEntry booking order entity.
 * @returns JSX of the history booking row.
 */
const HistoryBookingCard = ({ order }: { order: IOrderByMarkerEntity }): JSX.Element => {
  const dateRaw = (order.createdDate ??
    (order as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  const date = dateRaw ? formatDate(dateRaw) : '';
  return (
    <div className="flex items-center justify-between rounded-card border border-paper px-3.75 py-1.25">
      <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
      <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
      <p className="font-normal text-base text-paper">{date}</p>
    </div>
  );
};

export default BookingsContent;
