'use client';

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Модальный backdrop
 */
const ModalBackdrop = () => {
  const { setTransition } = useContext(OpenDrawerContext);

  return (
    <div
      id="modalBg"
      className="fixed inset-0 size-full min-w-full min-h-full bg-black/50"
      onClick={() => {
        setTransition('close');
      }}
    />
  );
};

export default ModalBackdrop;
