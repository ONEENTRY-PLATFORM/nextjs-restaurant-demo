'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

/**
 * ResetButton — clears all filter URL search params and replaces the route.
 *
 * @returns JSX of the reset button.
 */
const ResetButton = (): JSX.Element => {
  const t = useT();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const params = new URLSearchParams(searchParams);

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
      className="rounded-panel border border-brand text-brand font-bold text-base uppercase h-12.5 hover_btn_brand w-full"
    >
      {t('clear_all_filters_text', 'Clear all filters')}
    </button>
  );
};

export default ResetButton;
