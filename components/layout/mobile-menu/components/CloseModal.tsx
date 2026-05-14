'use client';

import { useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * CloseModal — mobile-menu close button (round X) that triggers the close transition.
 *
 * @returns JSX of the close button absolutely positioned in the drawer corner.
 */
const CloseModal = () => {
  const t = useT();
  const { setTransition } = useContext(OpenDrawerContext);
  return (
    <button
      aria-label={t('close_menu_label', 'Close menu')}
      onClick={() => {
        setTransition('close');
      }}
      className="absolute right-4 top-6 flex aspect-square size-12 shrink-0 items-center justify-center rounded-full border border-paper/40 text-xl text-paper transition-colors duration-200 hover:border-brand hover:text-brand active:border-brand active:text-brand"
    >
      &#10005;
    </button>
  );
};

export default CloseModal;
