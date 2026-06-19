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
import { BOOKING_PRODUCT_ID, FORMS, ORDER_STATUSES } from '@/app/utils/constants';
import { formatDate } from '@/app/utils/formatDate';
import { setPendingReservationEdit } from '@/components/reservation/reservationEditState';
import { TIME_SLOT_MARKER } from '@/components/reservation/reservationFormUtils';
import Spinner from '@/components/shared/Spinner';

const CANCELLED_STATUS = ORDER_STATUSES.bookingCancelled;
const HISTORY_STATUS_KEYWORDS = ['cancel', 'complet', 'deliver', 'reject', 'refund'];

/**
 * parseDateLoose — extracts a `Date` from heterogeneous OneEntry value shapes.
 *
 * Handles ISO strings, `{ fullDate }` date-attribute objects, and `[fromIso, toIso]`
 * tuples used by `timeInterval` (we use the `from` boundary as the booking moment).
 *
 * @param   {unknown} raw - Value from `IOrdersFormData.value`.
 * @returns Parsed `Date` or `null` when the input cannot be interpreted.
 */
const parseDateLoose = (raw: unknown): Date | null => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const d = parseDateLoose(item);
      if (d) return d;
    }
    return null;
  }
  if (typeof raw === 'object') {
    const obj = raw as { fullDate?: unknown; from?: unknown; value?: unknown };
    return (
      parseDateLoose(obj.fullDate) ?? parseDateLoose(obj.from) ?? parseDateLoose(obj.value) ?? null
    );
  }
  return null;
};

/**
 * getBookingDate — reservation moment extracted from the order's `formData`.
 *
 * Prefers the `time_slot` (timeInterval) field used by `ReservationForm`; falls back to any
 * `timeInterval` / `date`-typed field if the canonical marker is absent.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `Date` of the booking, or `null` when no date field is present.
 */
const getBookingDate = (o: IOrderByMarkerEntity): Date | null => {
  const fields = (o.formData as IOrdersFormData[] | undefined) ?? [];
  const slot = fields.find(f => f.marker === TIME_SLOT_MARKER);
  if (slot) {
    const d = parseDateLoose(slot.value);
    if (d) return d;
  }
  const byType = fields.find(f => f.type === 'timeInterval' || f.type === 'date');
  if (byType) {
    const d = parseDateLoose(byType.value);
    if (d) return d;
  }
  return null;
};

/**
 * isHistoryOrder — whether the booking order is in history (past date / completed / cancelled / rejected / refunded).
 *
 * Any booking whose reservation moment (`time_slot`) already lies in the past is treated as history regardless of status.
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns `true` when the booking belongs to history.
 */
const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  const id = (o.statusIdentifier ?? '').toLowerCase();
  if (id && HISTORY_STATUS_KEYWORDS.some(k => id.includes(k))) return true;
  const bookingDate = getBookingDate(o);
  if (bookingDate && bookingDate.getTime() < Date.now()) return true;
  return false;
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
 * formatBookingWhen — actual reservation moment as `DD.MM.YY HH:MM` (from `time_slot`), with a
 * fallback to the order's creation date when no slot is set.
 *
 * Read in UTC to match how `ReservationForm` stores/displays the picked slot (the picker writes
 * via `setUTCHours`, the popup reads back via `getUTCHours`).
 *
 * @param   {IOrderByMarkerEntity} o - OneEntry order entity.
 * @returns Formatted date + time string, empty when neither source is parseable.
 */
const formatBookingWhen = (o: IOrderByMarkerEntity): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const bookingDate = getBookingDate(o);
  if (bookingDate) {
    const dateStr = `${pad(bookingDate.getUTCDate())}.${pad(bookingDate.getUTCMonth() + 1)}.${String(bookingDate.getUTCFullYear()).slice(2)}`;
    const timeStr = `${pad(bookingDate.getUTCHours())}:${pad(bookingDate.getUTCMinutes())}`;
    return `${dateStr} ${timeStr}`;
  }
  const dateRaw = (o.createdDate ??
    (o as unknown as { formattedCreated?: string }).formattedCreated ??
    '') as string;
  return dateRaw ? formatDate(dateRaw) : '';
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
 * @returns JSX of the bookings dashboard section.
 */
const BookingsContent = (): JSX.Element => {
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const t = useT();

  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit: pending -> side-channel, open ReservationPopup; submit will call `Orders.updateOrderByMarkerAndId` instead of `createOrder`.
  // formIdentifier is optional on the list-endpoint response (IOrderByMarkerEntity), so default
  // to the storage marker — booking_order storage is bound to the form with the same identifier.
  // setOpen(true) is required when invoked from the /profile/bookings route (no drawer is open yet);
  // inside BookingsPopup/ProfilePopup `open` is already true and the call is a no-op.
  const onEdit = (order: IOrderByMarkerEntity) => {
    setPendingReservationEdit({
      orderId: order.id,
      formData: (order.formData as IOrdersFormData[] | undefined) ?? [],
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formIdentifier: order.formIdentifier ?? FORMS.bookingOrder,
    });
    setComponent('ReservationPopup');
    setOpen(true);
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
    const existingFormData = (order.formData as IOrdersFormData[] | undefined) ?? [];
    const products =
      order.products.length > 0
        ? order.products.map(p => ({ productId: p.id, quantity: p.quantity }))
        : [{ productId: BOOKING_PRODUCT_ID, quantity: 1 }];
    const body: IOrderData & { statusIdentifier?: string } = {
      formIdentifier: order.formIdentifier ?? FORMS.bookingOrder,
      paymentAccountIdentifier: order.paymentAccountIdentifier ?? 'cash',
      formData: existingFormData,
      products,
      statusIdentifier: CANCELLED_STATUS,
    };
    try {
      const res = await getApi().Orders.updateOrderByMarkerAndId(
        FORMS.bookingOrder,
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
    getAllOrdersByMarker({ marker: FORMS.bookingOrder, offset: 0, limit: 50 })
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
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {active.length === 0 ? (
        <p className="profile-anim-row text-center text-base text-paper/80">
          You have no active reservations.
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

      <p className="profile-anim-row mt-2.5 text-center font-bold text-xl tracking-fine text-brand">
        Reservation History
      </p>

      {history.length === 0 ? (
        <p className="profile-anim-row text-center text-base text-paper/80">
          No past reservations yet.
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
  const when = formatBookingWhen(order);

  return (
    <div className="profile-anim-row flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-card border border-brand px-3.75 py-1.25">
        <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
        <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
        <p className="font-normal text-base text-paper">{when}</p>
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
    <div className="profile-anim-row flex items-center justify-between rounded-card border border-paper px-3.75 py-1.25">
      <p className="font-bold text-base text-paper">№{formatOrderNumber(order)}</p>
      <p className="font-normal text-base text-paper">{statusLabel(order)}</p>
      <p className="font-normal text-base text-paper">{date}</p>
    </div>
  );
};

export default BookingsContent;
