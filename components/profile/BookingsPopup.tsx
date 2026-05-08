'use client';

import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import BookingsContent from './BookingsContent';

/**
 * Попап «Бронирования» — порт `static-html/mob_about_reservation.html`
 * (секции «Active reservation» и «Reservation History»). Открывается
 * через `OpenDrawerContext` (`component === 'BookingsPopup'`); триггер —
 * пункт «Bookings» в hover-дропдауне иконки профиля
 * ({@link import('@/components/layout/header/nav/NavItemProfile').default}),
 * у которого pageUrl `bookings` (child пункта `profile` в CMS-меню `user_menu`).
 *
 * Тело (загрузка списка, карточки, cancel/edit) вынесено в
 * {@link BookingsContent} — оно же реюзается на мобильном внутри
 * {@link import('./ProfilePopup').default} как один из экранов screen-swap'а
 * (паттерн `CartWizard`).
 */
const BookingsPopup = (): JSX.Element => {
  const { setOpen, setTransition } = useContext(OpenDrawerContext);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const close = () => setTransition('close');

  return (
    <DrawerAnimations component="BookingsPopup">
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

        <div className="mt-7.5">
          <BookingsContent />
        </div>
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default BookingsPopup;
