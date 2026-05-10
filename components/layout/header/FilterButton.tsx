'use client';

import { type JSX, useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FilterIcon from '@/components/icons/filter';

/**
 * FilterButton — header trigger that opens `FilterModal` via `OpenDrawerContext`.
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
      aria-label={label}
      className="cursor-pointer group bg-transparent border-0 p-0"
    >
      <FilterIcon />
    </button>
  );
};

export default FilterButton;
