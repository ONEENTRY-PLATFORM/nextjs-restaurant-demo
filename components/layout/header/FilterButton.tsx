'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FilterIcon from '@/components/icons/filter';

/**
 * FilterButton — триггер модалки фильтра. Монтируется и в десктопном, и в
 * мобильном header. Открывает {@link FilterModal} через OpenDrawerContext.
 * @param   {object} props          - Пропсы кнопки.
 * @param   {string} [props.label]  - Подпись для скринридера; по умолчанию
 *                                    «Open filters». Передаётся из шапки
 *                                    через `dict.open_filters_button.value`.
 * @returns {JSX.Element}           JSX кнопки фильтра.
 */
const FilterButton = ({
  label = 'Open filters',
}: {
  label?: string;
} = {}): JSX.Element => {
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
      aria-label={label}
      className="cursor-pointer group bg-transparent border-0 p-0"
    >
      <FilterIcon />
    </button>
  );
};

export default FilterButton;
