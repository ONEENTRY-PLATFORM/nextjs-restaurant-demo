'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FilterIcon from '@/components/icons/filter';

/**
 * FilterButton — trigger for the filter modal. Mounted in both desktop
 * and mobile headers. Opens {@link FilterModal} via OpenDrawerContext.
 * @returns {JSX.Element} Filter button JSX.
 */
const FilterButton = (): JSX.Element => {
  const { setOpen, setComponent, setTransition } =
    useContext(OpenDrawerContext);

  const handleClick = (): void => {
    setComponent('FilterForm');
    setTransition('');
    setOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open filters"
      className="cursor-pointer group bg-transparent border-0 p-0"
    >
      <FilterIcon />
    </button>
  );
};

export default FilterButton;
