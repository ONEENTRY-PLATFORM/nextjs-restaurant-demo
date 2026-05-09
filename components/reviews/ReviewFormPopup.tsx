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

import ReviewForm from './ReviewForm';

/**
 * ReviewFormPopup — попап с формой отзыва. productId прокидывается через `OpenDrawerContext.action`,
 * чтобы попап оставался глобально зарегистрированным без знания о текущей странице.
 */
const ReviewFormPopup = (): JSX.Element => {
  const t = useT();
  const { action, setOpen, setTransition } = useContext(OpenDrawerContext);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const productId = Number(action);
  if (!Number.isFinite(productId) || productId <= 0) return <></>;

  const close = () => setTransition('close');

  return (
    <DrawerAnimations component="ReviewFormPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-137.5 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
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
            {t('leave_review', 'Leave a review')}
          </p>
          <ClosePopupButton onClose={close} ariaLabel="Close review form" />
        </div>

        <div className="mt-7.5">
          <ReviewForm productId={productId} hideTitle />
        </div>
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default ReviewFormPopup;
