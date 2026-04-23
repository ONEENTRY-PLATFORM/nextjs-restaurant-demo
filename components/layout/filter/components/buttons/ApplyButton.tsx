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
      className="btn btn-xl btn-primary w-full"
    >
      {apply_button_placeholder?.value as string | undefined}
    </button>
  );
};

export default ApplyButton;
