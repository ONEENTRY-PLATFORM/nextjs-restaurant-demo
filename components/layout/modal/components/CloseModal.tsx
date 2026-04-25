'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * Close modal button
 */
const CloseModal = (): JSX.Element => {
  const { setTransition } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => setTransition('close')}
      className="flex size-12.5 items-center justify-center rounded-full border border-solid border-white transition-transform hover:rotate-180"
      aria-label="Close"
    >
      <CloseXBoldIcon />
    </button>
  );
};

export default CloseModal;
