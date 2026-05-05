'use client';

import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef } from 'react';

import { useGetChildPagesByParentUrlQuery, useGetFormByMarkerQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import ReservationForm from './ReservationForm';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';

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
          label:
            ((p.attributeValues?.address?.value as string | undefined) || p.localizeInfos?.title) ??
            'Restaurant',
          schedule: scheduleEntries,
        };
      }),
    [pages]
  );

  const initialValues = useMemo(() => (action ? { restaurant: action } : undefined), [action]);

  if (!isOpen) return <></>;

  const isLoading = isFormLoading || isPagesLoading;

  return (
    <>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 min-h-162.5 overflow-hidden right-0 z-20 flex max-h-[90vh] w-full flex-col sm:overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
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
            <ReservationForm form={form} restaurants={restaurants} initialValues={initialValues} />
          </div>
        )}
      </div>
      <ModalBackdrop />
    </>
  );
};

export default ReservationPopup;
