'use client';

import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGetChildPagesByParentUrlQuery, useGetFormByMarkerQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import { consumePendingReservationEdit, type PendingReservationEdit } from './reservationEditState';
import ReservationForm from './ReservationForm';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';

/**
 * Конвертирует `order.formData` (формат OneEntry — `{marker, type, value}[]`)
 * в плоский `Record<marker, string>` для useState формы. Обратная операция
 * к билдеру payload в {@link ReservationForm}.
 *  - `string`/`integer`     → `String(value)`
 *  - `text`                 → `value[0].plainValue`
 *  - `entity`               → ищем ресторан с `id === value[0]`, берём его `value` (pageUrl)
 *  - `timeInterval`         → `[[startISO, endISO]]` → `"yyyy-MM-dd HH.MM"` (start)
 *  - `date`                 → `fullDate.slice(0, 10)`
 *  - всё остальное          → пропускаем (spam/button и unsupported)
 * @param   {IOrdersFormData[]}  formData    - Сырые поля заказа.
 * @param   {RestaurantOption[]} restaurants - Доступные опции для маппинга entity → pageUrl.
 * @returns {Record<string, string>}         Плоский набор начальных значений.
 */
const buildInitialValuesFromOrder = (
  formData: IOrdersFormData[],
  restaurants: RestaurantOption[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const item of formData) {
    const { marker, type, value } = item;
    if (type === 'string' || type === 'integer' || type === 'real' || type === 'float') {
      result[marker] = value == null ? '' : String(value);
    } else if (type === 'text') {
      const arr = Array.isArray(value) ? (value as Array<{ plainValue?: string }>) : [];
      result[marker] = arr[0]?.plainValue ?? '';
    } else if (type === 'entity') {
      const ids = Array.isArray(value) ? (value as number[]) : [];
      const id = ids[0];
      const opt = id != null ? restaurants.find(r => r.id === id) : undefined;
      if (opt) result[marker] = opt.value;
    } else if (type === 'timeInterval') {
      const arr = Array.isArray(value) ? (value as Array<[string, string]>) : [];
      const first = arr[0];
      if (first && first[0]) {
        const start = new Date(first[0]);
        const yyyy = start.getUTCFullYear();
        const mm = String(start.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(start.getUTCDate()).padStart(2, '0');
        const hh = String(start.getUTCHours()).padStart(2, '0');
        const min = String(start.getUTCMinutes()).padStart(2, '0');
        result[marker] = `${yyyy}-${mm}-${dd} ${hh}.${min}`;
      }
    } else if (type === 'date') {
      const v = value as { fullDate?: string } | undefined;
      if (v?.fullDate) result[marker] = v.fullDate.slice(0, 10);
    }
  }
  return result;
};

/**
 * Попап бронирования столика — открывается по кнопке `BOOK A TABLE`
 * со страницы конкретного ресторана (см. `app/restaurants/[handle]/page.tsx`)
 * и из любых мест, где `setComponent('ReservationPopup')` вызван на
 * {@link OpenDrawerContext}. Ресторан, выбранный в дропдауне, передаётся
 * через `OpenDrawerContext.action` (= pageUrl ресторана) — тогда поле
 * `restaurant` формы предзаполняется этим значением.
 *
 * Данные тянутся клиентскими RTK-запросами:
 *  - {@link useGetFormByMarkerQuery} с `marker: 'booking_order'` — описание
 *    атрибутов формы из OneEntry (поля name/surname/phone/people_count/
 *    date/time/preferences/captcha).
 *  - {@link useGetChildPagesByParentUrlQuery} с `url: 'restaurants'` —
 *    список ресторанов для дропдауна, формат `RestaurantOption`
 *    (тот же, что у server-side `app/reservation/page.tsx`).
 *
 * При закрытом попапе оба запроса skip'аются (`{ skip: !isOpen }`),
 * чтобы не дёргать сеть на любой странице сайта.
 */
const ReservationPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, action, transition, setOpen, setTransition } =
    useContext(OpenDrawerContext);
  const isOpen = open && component === 'ReservationPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Свайп вниз закрывает напрямую — без GSAP-tween'а.
  useSwipeToClose(sheetRef, () => setOpen(false));

  // У ReservationPopup нет своего GSAP-Animations wrapper'а
  // (FavoritesPopup/ProfilePopup имеют), некому реагировать на
  // `setTransition('close')`. ModalBackdrop по клику зовёт именно
  // `setTransition('close')`, поэтому слушаем это значение здесь и
  // закрываем синхронно.
  useEffect(() => {
    if (isOpen && transition === 'close') {
      setOpen(false);
      setTransition('');
    }
  }, [isOpen, transition, setOpen, setTransition]);

  const close = () => setOpen(false);

  const { data: form, isLoading: isFormLoading } = useGetFormByMarkerQuery(
    { marker: 'booking_order' },
    { skip: !isOpen }
  );
  const { data: pages, isLoading: isPagesLoading } = useGetChildPagesByParentUrlQuery(
    { url: 'restaurants' },
    { skip: !isOpen }
  );

  // Маппинг как в `app/reservation/page.tsx` — value берётся из
  // `pageUrl` (стабильный маркер), label — из `address` или `title`.
  // Дополнительно прокидываем `schedule` (атрибут `timeInterval` на
  // странице ресторана), чтобы TimePicker мог показать только реально
  // доступные слоты для выбранной даты.
  const restaurants: RestaurantOption[] = useMemo(
    () =>
      (pages ?? []).map((p: IPagesEntity) => {
        const scheduleRaw = p.attributeValues?.schedule?.value;
        // OneEntry возвращает schedule как
        // `[{ values: ScheduleSlotEntry[] }, ...]`. Сплющиваем все
        // `values` в один плоский массив записей.
        const scheduleEntries: ScheduleSlotEntry[] = Array.isArray(scheduleRaw)
          ? (scheduleRaw as Array<{ values?: ScheduleSlotEntry[] }>).flatMap(
              group => group?.values ?? []
            )
          : [];
        return {
          value: p.pageUrl ?? String(p.id),
          id: p.id,
          label:
            ((p.attributeValues?.address?.value as string | undefined) || p.localizeInfos?.title) ??
            'Restaurant',
          schedule: scheduleEntries,
        };
      }),
    [pages]
  );

  // Edit-режим: при открытии попапа вычитываем pending-данные из side-channel
  // (см. `reservationEditState`). Если они есть — попап рендерится в режиме
  // редактирования брони: ReservationForm получит editingOrderId и при
  // submit'е вызовет `updateOrderByMarkerAndId` вместо `createOrder`.
  // Сбрасывается на закрытие попапа.
  const [editing, setEditing] = useState<PendingReservationEdit | null>(null);
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(consumePendingReservationEdit());
    } else {
      setEditing(null);
    }
  }, [isOpen]);

  const initialValues = useMemo(() => {
    if (editing) {
      return buildInitialValuesFromOrder(editing.formData, restaurants);
    }
    return action ? { restaurant: action } : undefined;
  }, [action, editing, restaurants]);

  if (!isOpen) return <></>;

  const isLoading = isFormLoading || isPagesLoading;

  return (
    <>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 min-h-162.5 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        {/* Шапка по Figma-макету «Reservation»: стрелка-назад слева,
            заголовок (orange, semibold) по центру, X-кнопка справа.
            Back делает то же, что и X (закрывает попап) — отдельной
            истории шагов внутри ReservationPopup нет. */}
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-[24px] text-brand">
            {t('reservation_default_title', 'Reservation')}
          </p>
          <ClosePopupButton onClose={close} ariaLabel="Close reservation" />
        </div>

        {isLoading ? (
          <div className="mt-15 flex w-full justify-center">
            <Loader />
          </div>
        ) : !form ? (
          <div className="mt-10 rounded-xl bg-ink/60 p-6 text-center text-paper/80">
            {t('reservation_form_unavailable', 'Reservation form is unavailable.')}
          </div>
        ) : (
          <div className="mt-7.5">
            <ReservationForm
              form={form}
              restaurants={restaurants}
              initialValues={initialValues}
              editingOrder={editing}
              onClose={close}
            />
          </div>
        )}
      </div>
      <ModalBackdrop />
    </>
  );
};

export default ReservationPopup;
