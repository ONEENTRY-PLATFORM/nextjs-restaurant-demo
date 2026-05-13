'use client';

import { type JSX, useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CategoryBarsIcon from '@/components/icons/category-bars';

/**
 * CategoryButton — burger in the desktop nav row that opens `CategoryFilter`.
 *
 * @returns JSX of the desktop category button (hidden below md).
 */
const CategoryButton = (): JSX.Element => {
  const t = useT();
  const { setOpen, setComponent, setTransition } = useContext(OpenDrawerContext);

  const handleClick = (): void => {
    setComponent('CategoryFilter');
    setTransition('');
    setOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-header-anim="tag"
      aria-label={t('open_categories_label', 'Open categories')}
      className="hidden md:block bg-transparent border-0 p-0 md:mr-6.25 lg:mr-12 min-h-9 cursor-pointer"
    >
      <CategoryBarsIcon />
    </button>
  );
};

export default CategoryButton;
