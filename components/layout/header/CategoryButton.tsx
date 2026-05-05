'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CategoryBarsIcon from '@/components/icons/category-bars';

/**
 * CategoryButton — burger-SVG в десктопном nav-ряду, открывающий боковую панель
 * {@link CategoryFilter} слева.
 * @returns {JSX.Element} JSX триггера категорий.
 */
const CategoryButton = (): JSX.Element => {
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
      aria-label="Open categories"
      className="hidden md:block bg-transparent border-0 p-0 md:mr-6.25 lg:mr-10 -ml-3.75 cursor-pointer"
    >
      <CategoryBarsIcon />
    </button>
  );
};

export default CategoryButton;
