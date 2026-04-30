'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Компонент кнопки применения фильтра
 */
const ApplyButton = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const { setTransition } = useContext(OpenDrawerContext);
  const { apply_text } = dict;

  return (
    <button
      onClick={() => setTransition('close')}
      className="rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white h-12.5 hover:bg-gradient-to-r-hover w-full"
    >
      {(apply_text?.value as string | undefined) ?? 'Apply'}
    </button>
  );
};

export default ApplyButton;
