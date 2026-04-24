'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

/**
 * Reset filter button component
 */
const ResetButton = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const params = new URLSearchParams(searchParams);

  const { reset_button_placeholder } = dict;

  const onResetHandle = () => {
    params.delete('search');
    params.delete('color');
    params.delete('in_stock');
    params.delete('minPrice');
    params.delete('maxPrice');
    replace(pathname);
  };

  return (
    <button
      onClick={onResetHandle}
      className="rounded-[10px] border border-brand text-brand font-bold text-[16px] uppercase h-12.5 hover_btn_white w-full"
    >
      {reset_button_placeholder?.value as string | undefined}
    </button>
  );
};

export default ResetButton;
