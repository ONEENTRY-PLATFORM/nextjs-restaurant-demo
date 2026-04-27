'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXMiniIcon from '@/components/icons/close-x-mini';

/**
 * Central outlined close button — visible only while a drawer (cart popup,
 * filter, sign-in modal, etc.) is open. Replaces the protruding cart button
 * for the duration of the drawer. Dispatches `setTransition('close')` so the
 * drawer's own GSAP reverse animation plays before unmount.
 */
const CenterCloseButton = (): JSX.Element | null => {
  const { open, setTransition } = useContext(OpenDrawerContext);

  if (!open) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="close"
      onClick={() => setTransition('close')}
      className="bg-transparent border w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 hover:border-[#EC722B] group"
    >
      <CloseXMiniIcon />
    </button>
  );
};

export default CenterCloseButton;
