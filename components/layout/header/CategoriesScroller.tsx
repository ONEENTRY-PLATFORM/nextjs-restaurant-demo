'use client';

import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { useDragScroll } from '@/app/hooks/useDragScroll';

type CategoriesScrollerProps = {
  pages: IPagesEntity[];
};

/**
 * Horizontal snap-scroll list of category links with mouse drag-to-scroll
 * behavior (per `static-html/script.js`). Native touch scrolling works
 * unchanged.
 * @param   {CategoriesScrollerProps} props - Component props.
 * @returns {JSX.Element}                   Scroller JSX.
 */
const CategoriesScroller = ({
  pages,
}: CategoriesScrollerProps): JSX.Element => {
  const ref = useDragScroll<HTMLUListElement>();

  return (
    <ul
      ref={ref}
      id="menuItems"
      className="flex gap-2.75 sm:px-3 md:gap-6.25 my-5.75 md:mt-8 md:m-0 overflow-x-auto w-full p-0 no-scrollbar cursor-grab active:cursor-grabbing snap-x snap-mandatory select-none"
    >
      {pages.map((page) => (
        <li key={page.id} className="list_item">
          <Link
            href={'/shop/category/' + page.pageUrl}
            className="list_link"
            draggable={false}
          >
            {page.localizeInfos?.title ?? page.pageUrl}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default CategoriesScroller;
