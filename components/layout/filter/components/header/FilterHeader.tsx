'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

import CloseModal from './CloseModal';
import HistoryBack from './HistoryBack';

/**
 * FilterHeader — sticky header for the filter modal: back / title / close.
 *
 * @returns {JSX.Element} JSX of the filter header bar.
 */
const FilterHeader = (): JSX.Element => {
  const t = useT();

  return (
    <header className="flex w-full flex-col justify-center whitespace-nowrap bg-ink/80 p-8 text-2xl font-bold text-white max-md:px-6 max-md:py-4">
      <div className="flex justify-between gap-5">
        <HistoryBack />
        <div className="my-auto">{t('open_filters_button', 'Open filters')}</div>
        <CloseModal />
      </div>
    </header>
  );
};

export default FilterHeader;
