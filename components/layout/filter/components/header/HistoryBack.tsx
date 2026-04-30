'use client';

import { useRouter } from 'next/navigation';
import type { JSX } from 'react';

import ArrowBackIcon from '@/components/icons/arrow-back';

/**
 * Компонент кнопки «назад по истории»
 */
const HistoryBack = (): JSX.Element => {
  const router = useRouter();
  return (
    <button
      type="button"
      className="group flex size-12 items-center justify-center rounded-full border border-solid border-paper/40 bg-transparent transition-colors duration-200 hover:border-brand max-sm:p-3 md:size-10 md:p-3 lg:size-12.5 lg:p-3.5"
      aria-label="Go back"
      onClick={() => router.back()}
    >
      <ArrowBackIcon className="fill-paper group-hover:fill-brand" />
    </button>
  );
};

export default HistoryBack;
