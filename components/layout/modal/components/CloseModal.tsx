'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * Close-modal button.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      [props.className] - Extra utility classes merged onto the button (e.g. responsive visibility overrides).
 * @returns Button JSX.
 */
const CloseModal = ({ className = '' }: { className?: string }): JSX.Element => {
  const t = useT();
  const { setTransition } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => setTransition('close')}
      className={`flex size-12.5 items-center justify-center rounded-full border border-solid border-white transition-transform hover:rotate-180 ${className}`}
      aria-label={t('close_label', 'Close')}
    >
      <CloseXBoldIcon />
    </button>
  );
};

export default CloseModal;
