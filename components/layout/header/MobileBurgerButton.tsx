'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import BurgerIcon from '@/components/icons/burger';

/**
 * MobileBurgerButton — burger-иконка в мобильной шапке, открывающая боковую
 * панель {@link CategoryFilter} слева через {@link OpenDrawerContext}.
 * @returns {JSX.Element} JSX триггера категорий для мобильной шапки.
 */
const MobileBurgerButton = (): JSX.Element => {
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
      className="cursor-pointer group_stroke bg-transparent border-0 p-0"
    >
      <BurgerIcon />
    </button>
  );
};

export default MobileBurgerButton;
