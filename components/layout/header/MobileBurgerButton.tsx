'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import BurgerIcon from '@/components/icons/burger';

/**
 * MobileBurgerButton — burger in the mobile header that opens `CategoryFilter`.
 *
 * @returns {JSX.Element} JSX of the burger button.
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
