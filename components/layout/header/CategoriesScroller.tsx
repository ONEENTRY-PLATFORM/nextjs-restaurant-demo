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
 * Horizontal snap-scroll list of `preferences` filter chips
 * (OneEntry `dish` attribute set, list-type attribute `preferences`).
 *
 * Each chip is a Link to `/shop?preferences=<value>`, picked up by
 * `getSearchParams` and translated into a `preferences in <value>`
 * filter for `Products.getProducts` / `getProductsByPageUrl`. Active
 * chip is the one whose value matches the current `?preferences=` —
 * clicking it again strips the param.
 *
 * Native touch scrolling works unchanged; mouse drag-to-scroll is
 * provided by `useDragScroll` (per `static-html/script.js`).
 * @param   {CategoriesScrollerProps} props - Component props.
 * @returns {JSX.Element}                   Scroller JSX.
 */
const CategoriesScroller = ({
  preferences,
}: CategoriesScrollerProps): JSX.Element => {
  const ref = useDragScroll<HTMLUListElement>();
  const searchParams = useSearchParams();
  const active = searchParams.get('preferences') ?? '';

  return (
    <ul
      ref={ref}
      id="menuItems"
      className="flex gap-2.75 sm:px-3 md:gap-6.25 my-5.75 md:mt-8 md:m-0 overflow-x-auto w-full p-0 no-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory select-none"
    >
      {preferences.map((option) => {
        const isActive = active === option.value;
        const href = isActive
          ? '/shop'
          : '/shop?preferences=' + encodeURIComponent(option.value);
        return (
          <li key={option.value} className="list_item">
            <Link
              href={href}
              className={'list_link' + (isActive ? ' text-brand' : '')}
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
