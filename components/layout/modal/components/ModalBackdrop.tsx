'use client';

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * ModalBackdrop — semi-transparent backdrop that triggers the close transition on click.
 *
 * @returns JSX of the absolute-positioned backdrop element.
 */
const ModalBackdrop = () => {
  const { setTransition } = useContext(OpenDrawerContext);

  return (
    <div
      id="modalBg"
      className="fixed inset-0 size-full min-h-full min-w-full bg-black/50"
      onClick={() => {
        setTransition('close');
      }}
    />
  );
};

export default ModalBackdrop;
