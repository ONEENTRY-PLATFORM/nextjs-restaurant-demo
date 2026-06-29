'use client';

import type { JSX } from 'react';
import { useContext, useRef } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import BookingsContent from './BookingsContent';

/**
 * BookingsPopup — «Bookings» popup (Active reservation + History).
 * @returns JSX of the bookings drawer.
 */
const BookingsPopup = (): JSX.Element => {
  const { setOpen, setTransition } = useContext(OpenDrawerContext);
  const t = useT();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const close = () => setTransition('close');

  return (
    <DrawerAnimations component="BookingsPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-20 flex max-h-dvh w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 shadow-xl backdrop-blur-card md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:h-auto md:max-h-[90vh] md:max-w-150 md:-translate-1/2 md:rounded-[20px] md:p-10"
      >
        {/* Header: back / title / X */}
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label={t('back_text', 'Back')}
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="text-2xl font-semibold text-brand">
            {t('active_reservation_title', 'Active reservation')}
          </p>
          <ClosePopupButton onClose={close} ariaLabel="Close bookings" className="max-md:hidden" />
          <span aria-hidden="true" className="size-11.5 md:hidden" />
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
