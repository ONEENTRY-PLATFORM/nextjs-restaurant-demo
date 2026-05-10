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
 * BookingsPopup — «Bookings» popup (Active reservation + History). Body lives in
 * {@link BookingsContent}; this wrapper handles the drawer chrome (close button,
 * swipe-to-close, transition state from `OpenDrawerContext`).
 *
 * @returns {JSX.Element} JSX of the bookings drawer.
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
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-card shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        {/* Header: back / title / X */}
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-2xl text-brand">Active reservation</p>
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
