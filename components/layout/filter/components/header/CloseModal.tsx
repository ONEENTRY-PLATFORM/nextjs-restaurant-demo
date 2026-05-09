'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/** Кнопка закрытия модалки. */
const CloseModal = (): JSX.Element => {
  const { setTransition } = useContext(OpenDrawerContext);
  return (
    <button
      className="z-10 size-12 items-center justify-center rounded-full border border-solid border-paper/40 bg-transparent text-lg text-paper transition-colors hover:border-brand hover:text-brand md:size-10 lg:size-12.5 lg:p-2.5"
      onClick={() => {
        setTransition('close');
      }}
    >
      &#10005;
    </button>
  );
};

export default CloseModal;
