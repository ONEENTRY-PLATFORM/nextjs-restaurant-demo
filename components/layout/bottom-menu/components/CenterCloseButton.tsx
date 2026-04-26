'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXMiniIcon from '@/components/icons/close-x-mini';

/**
 * Central outlined close button — visible only while a drawer (cart, sign-in,
 * etc.) is open. Clicking it dismisses the drawer.
 */
const CenterCloseButton = (): JSX.Element | null => {
  const { open, setOpen } = useContext(OpenDrawerContext);

  if (!open) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="close"
      onClick={() => setOpen(false)}
      className="bg-transparent border w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 hover:border-[#EC722B] group"
    >
      <CloseXMiniIcon />
    </button>
  );
};

export default CenterCloseButton;
