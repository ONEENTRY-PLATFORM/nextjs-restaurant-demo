'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getAllOrdersByMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { formatDate } from '@/app/utils/formatDate';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

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
 * Попап «Бронирования» — порт `static-html/mob_about_reservation.html`
 * (секции «Active reservation» и «Reservation History»). Открывается
 * через `OpenDrawerContext` (`component === 'BookingsPopup'`); триггер
 * — пункт «Bookings» в hover-дропдауне иконки профиля
 * (`NavItemProfile`), у которого pageUrl `bookings` (child пункта
 * `profile` в CMS-меню `user_menu`).
 *
 * Данные тянутся через `getAllOrdersByMarker({ marker: 'booking_order' })`
 * — тот же storage-маркер, что используется при сабмите формы
 * `ReservationForm`. Активные брони фильтруются по статусу (исключаем
 * `canceled / completed / ...`); остальные попадают в History.
 *
 * Cancel/Edit пока заглушены (toast-сообщение). Реальные actions —
 * отдельная задача (зависит от админ-настройки статусов и допустимых
 * переходов в OneEntry orders).
 */
const BookingsPopup = (): JSX.Element => {
  const { open, component, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const { user } = useContext(AuthContext);
  const isOpen = open && component === 'BookingsPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useSwipeToClose(sheetRef, () => setOpen(false));

  // Бекдроп шлёт `setTransition('close')` — реагируем на это и закрываем.
  useEffect(() => {
    if (isOpen && transition === 'close') {
      setOpen(false);
      setTransition('');
    }
  }, [isOpen, transition, setOpen, setTransition]);

  // Грузим бронирования при открытии (только для авторизованных).
  useEffect(() => {
    if (!isOpen || !user) return;
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
  }, [isOpen, user]);

  const { active, history } = useMemo(() => {
    const a: IOrderByMarkerEntity[] = [];
    const h: IOrderByMarkerEntity[] = [];
    for (const o of orders) {
      (isHistoryOrder(o) ? h : a).push(o);
    }
    return { active: a, history: h };
  }, [orders]);

  if (!isOpen) return <></>;

  const close = () => setOpen(false);

  return (
    <>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        {/* Шапка по образцу ReservationPopup: back / title / X */}
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-[24px] text-brand">Active reservation</p>
          <ClosePopupButton onClose={close} ariaLabel="Close bookings" />
        </div>

        {isLoading ? (
          <div className="mt-10 flex w-full justify-center">
            <Loader />
          </div>
        ) : (
          <div className="mt-7.5 flex flex-col gap-5">
            {active.length === 0 ? (
              <p className="text-center text-base text-paper/80">
                You have no active reservations.
              </p>
            ) : (
              active.map(o => <ActiveBookingCard key={o.id} order={o} />)
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
        )}
      </div>
      <ModalBackdrop />
    </>
  );
};

/**
 * Карточка активной брони — orange-bordered pill с номером, статусом и
 * датой + ряд Cancel/Edit. Cancel/Edit сейчас заглушки — реальные
 * actions требуют допустимых статус-переходов в OneEntry.
 */
const ActiveBookingCard = ({ order }: { order: IOrderByMarkerEntity }): JSX.Element => {
  // !!! SDK тип `IOrderByMarkerEntity` не объявляет `formattedCreated`,
  // но поле приходит в реальных ответах — берём через локальный cast,
  // если нет `createdDate`.
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
          className="hover_btn_white flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-paper text-base text-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          className="hover_btn_white flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-brand text-base text-brand"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

/**
 * Карточка из истории — паste-grey pill с номером, статусом и датой.
 * Без Cancel/Edit, потому что бронь уже завершена/отменена.
 */
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

export default BookingsPopup;
