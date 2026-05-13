'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { JSX } from 'react';

import { useDragScroll } from '@/app/hooks/useDragScroll';

export type PreferenceOption = {
  title: string;
  value: string;
};

type CategoriesScrollerProps = {
  preferences: PreferenceOption[];
};

/**
 * CategoriesScroller — horizontal snap-scroll list of `preferences` filter chips.
 *
 * @param   {CategoriesScrollerProps} props             - Component props.
 * @param   {PreferenceOption[]}      props.preferences - Available preference filter options sourced from OneEntry.
 * @returns JSX of the scrollable chip list.
 */
const CategoriesScroller = ({ preferences }: CategoriesScrollerProps): JSX.Element => {
  const ref = useDragScroll<HTMLUListElement>();
  const searchParams = useSearchParams();
  const activeSet = new Set(
    (searchParams.get('preferences') ?? '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  );

  const buildHref = (value: string, isActive: boolean): string => {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(activeSet);
    if (isActive) next.delete(value);
    else next.add(value);
    if (next.size > 0) params.set('preferences', [...next].join(','));
    else params.delete('preferences');
    const qs = params.toString();
    return qs ? '/shop?' + qs : '/shop';
  };

  return (
    <ul
      ref={ref}
      id="menuItems"
      className="flex gap-2.75 sm:px-3 md:gap-6.25 my-5.75 md:mt-8 md:m-0 overflow-x-auto w-full p-0 no-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory select-none py-1"
    >
      {preferences.map(option => {
        const isActive = activeSet.has(option.value);
        return (
          <li
            key={option.value}
            data-header-anim="tag"
            className={'list_item' + (isActive ? ' border-brand' : '')}
          >
            <Link
              href={buildHref(option.value, isActive)}
              className={'list_link' + (isActive ? ' bg-brand text-white' : '')}
              draggable={false}
            >
              {option.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default CategoriesScroller;
