import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import CloseModal from './CloseModal';
import HistoryBack from './HistoryBack';

/**
 * Компонент Filter Header
 */
const FilterHeader = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const { open_filters_button } = dict;

  return (
    <header className="flex w-full flex-col justify-center whitespace-nowrap bg-[rgba(76,77,86,0.8)] p-8 text-2xl font-bold text-white max-md:px-6 max-md:py-4">
      <div className="flex justify-between gap-5">
        <HistoryBack />
        <div className="my-auto">
          {(open_filters_button?.value as string | undefined) ?? 'Open filters'}
        </div>
        <CloseModal />
      </div>
    </header>
  );
};

export default FilterHeader;
