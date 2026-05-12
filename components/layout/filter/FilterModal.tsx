'use client';

import type { JSX } from 'react';
import { Suspense, useContext, useRef } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import Loader from '@/components/shared/Loader';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import ModalBackdrop from '../modal/components/ModalBackdrop';
import FilterHeader from './components/header/FilterHeader';
import type { PriceBounds } from './components/price/PricePickerFilter';
import FiltersForm from './FiltersForm';

/**
 * FilterModal — filters modal with slide-right animation, swipe-to-close on mobile.
 *
 * @param   {object}        props        - Component props.
 * @param   {PriceBounds}   props.prices - Catalog price bounds passed to `PricePickerFilter`.
 * @returns JSX of the filter modal drawer (header + suspended `<FiltersForm />`).
 */
const FilterModal = ({ prices }: { prices: PriceBounds }): JSX.Element => {
  const { setOpen } = useContext(OpenDrawerContext);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Swipe closes directly, bypassing GSAP reverse - otherwise the inline
  // transform conflicts with the `yPercent` tween of the close animation.
  useSwipeToClose(sheetRef, () => setOpen(false));

  return (
    <DrawerAnimations component="FilterForm" variant="slide-right">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed right-0 top-0 z-20 flex size-full max-h-dvh min-h-dvh flex-col overflow-auto bg-ink/80 backdrop-blur-card shadow-xl md:top-[5vh] md:max-h-[90vh] md:min-h-[90vh] md:overflow-hidden md:rounded-l-[20px] lg:h-auto lg:w-95"
      >
        <FilterHeader />
        <Suspense fallback={<Loader />}>
          <FiltersForm prices={prices} />
        </Suspense>
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default FilterModal;
