'use client';

import { type JSX, useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FilterIcon from '@/components/icons/filter';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * FilterButton — header trigger that opens `FilterBottom` via `OpenDrawerContext` (sets `component='FilterForm'`).
 *
 * @returns JSX of the filter button.
 */
const FilterButton = (): JSX.Element => {
  const t = useT();
  const label = t('open_filters_button', 'Open filters');
  const { setOpen, setComponent, setTransition } = useContext(OpenDrawerContext);

  const handleClick = (): void => {
    setComponent('FilterForm');
    setTransition('');
    setOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={() => prefetchPopup('FilterForm')}
      onFocus={() => prefetchPopup('FilterForm')}
      aria-label={label}
      className="group cursor-pointer border-0 bg-transparent p-0"
    >
      <FilterIcon />
    </button>
  );
};

export default FilterButton;
