'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Apply filter button component
 */
const ApplyButton = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const { setTransition } = useContext(OpenDrawerContext);
  const { apply_button_placeholder } = dict;

  return (
    <button
      onClick={() => setTransition('close')}
      className="rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white h-12.5 hover:bg-gradient-to-r-hover w-full"
    >
      {apply_button_placeholder?.value as string | undefined}
    </button>
  );
};

export default ApplyButton;
