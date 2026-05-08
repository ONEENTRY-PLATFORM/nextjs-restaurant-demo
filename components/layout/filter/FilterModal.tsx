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
 * Компонент FilterModal
 */
const FilterModal = ({ prices }: { prices: PriceBounds }): JSX.Element => {
  const { setOpen } = useContext(OpenDrawerContext);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп закрывает напрямую, минуя GSAP-reverse, чтобы inline-transform
  // от хука не конфликтовал с `yPercent`-tween-ом close-анимации.
  useSwipeToClose(sheetRef, () => setOpen(false));

  return (
    <DrawerAnimations component="FilterForm" variant="slide-right">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed right-0 top-0 z-20 flex size-full max-h-[90vh] min-h-[90vh] flex-col overflow-auto bg-ink/80 backdrop-blur-[10px] shadow-xl md:top-[5vh] md:overflow-hidden md:rounded-l-[20px] lg:h-auto lg:w-95"
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
