/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { Suspense } from 'react';

import Loader from '@/components/shared/Loader';

import ModalBackdrop from '../modal/components/ModalBackdrop';
import FilterModalAnimations from './animations/FilterModalAnimations';
import FilterHeader from './components/header/FilterHeader';
import FiltersForm from './FiltersForm';

/**
 * FilterModal component
 */
const FilterModal = ({
  prices,
  dict,
}: {
  prices: any | undefined;
  dict: IAttributeValues;
}): JSX.Element => {
  return (
    <FilterModalAnimations>
      <div
        id="modalBody"
        className="fixed right-0 top-0 z-20 flex size-full max-h-[90vh] min-h-[90vh] flex-col overflow-auto bg-[rgba(76,77,86,0.8)] backdrop-blur-[10px] shadow-xl md:top-[5vh] md:overflow-hidden md:rounded-l-[20px] lg:h-auto lg:w-95"
      >
        <FilterHeader dict={dict} />
        <Suspense fallback={<Loader />}>
          <FiltersForm prices={prices} dict={dict} />
        </Suspense>
      </div>
      <ModalBackdrop />
    </FilterModalAnimations>
  );
};

export default FilterModal;
