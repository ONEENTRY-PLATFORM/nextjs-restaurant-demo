'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * ApplyButton — primary "Apply" button at the bottom of the filter modal; closes the drawer.
 *
 * @returns JSX of the apply button.
 */
const ApplyButton = (): JSX.Element => {
  const t = useT();
  const { setTransition } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => setTransition('close')}
      className="rounded-panel bg-custom-gradient font-bold text-base uppercase text-white h-12.5 hover:bg-gradient-to-r-hover w-full"
    >
      {t('apply_text', 'Apply')}
    </button>
  );
};

export default ApplyButton;
