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
 * Горизонтальный snap-scroll список filter-чипов `preferences`
 * (set атрибутов `dish` в OneEntry, list-type атрибут `preferences`).
 *
 * Каждый чип — Link на `/shop?preferences=<value>`, который подхватывается
 * `getSearchParams` и транслируется в фильтр `preferences in <value>` для
 * `Products.getProducts` / `getProductsByPageUrl`. Активный чип — тот, чьё
 * value совпадает с текущим `?preferences=`; повторный клик по нему сбрасывает
 * параметр.
 *
 * Нативный touch-скролл работает без изменений; mouse drag-to-scroll реализован
 * через `useDragScroll` (по `static-html/script.js`).
 * @param   {CategoriesScrollerProps} props - Пропсы компонента.
 * @returns {JSX.Element}                   JSX скроллера.
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
