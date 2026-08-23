'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/types';
import { type JSX, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { getImageUrl } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

type Category = {
  label: string;
  /** Empty string when no CMS icon is configured — the tile renders an empty circle. */
  icon: string;
  href: string;
};

// Trailing CTA — hardcoded since it lives outside the `menu` page tree (not a CMS category).
const BOOKING_TILE: Category = {
  label: 'BOOKING\nTABLE',
  icon: '/content/categories/booking_table.svg',
  href: '/restaurants',
};

/**
 * CategoryFilter — left-side slide-in panel with the menu category list + "Booking Table" CTA.
 *
 * @param   {object}          props       - Component props.
 * @param   {IPagesEntity[]}  props.pages - Child pages of the `menu` page.
 * @returns JSX of the category panel (drawer + backdrop).
 */
const CategoryFilter = ({ pages }: { pages: IPagesEntity[] }): JSX.Element => {
  const { open, component, transition, setOpen, setComponent, setTransition } =
    useContext(OpenDrawerContext);
  const t = useT();

  const isVisible = open && component === 'CategoryFilter';

  const close = useCallback((): void => {
    setOpen(false);
    setComponent('');
  }, [setOpen, setComponent]);

  useEffect(() => {
    if (isVisible && transition === 'close') {
      close();
      setTransition('');
    }
  }, [isVisible, transition, close, setTransition]);

  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if ((e.changedTouches[0]?.clientY ?? 0) - touchStartY.current > 80) close();
  };

  const categories = useMemo<Category[]>(() => {
    const fromCms = pages
      .filter(p => p.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map<Category>(p => {
        // SDK returns `menu_icon.value` as an array of image objects for Pages (per the
        // `attribute-values` rule). `getImageUrl` already unwraps the first element. When the
        // admin hasn't configured an icon, this returns `''` and the tile shows an empty circle —
        // no local fallback by design (icons must come from CMS).
        const cmsIcon = getImageUrl(
          p.attributeValues?.menu_icon?.value as
            Array<{ downloadLink?: string }> | { downloadLink?: string } | null | undefined
        );
        return {
          label: (p.localizeInfos?.title ?? p.pageUrl).toUpperCase(),
          icon: cmsIcon,
          href: '/shop/category/' + p.pageUrl,
        };
      });
    return [...fromCms, BOOKING_TILE];
  }, [pages]);

  return (
    <>
      <div
        onClick={close}
        className={
          'fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ' +
          (isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden="true"
      />
      <aside
        className={
          'fixed left-0 top-0 bottom-0 z-500 w-full md:w-100 max-w-full bg-ink/95 backdrop-blur-card overflow-y-auto rounded-tl-5 rounded-tr-5 md:rounded-tl-none md:rounded-br-5 px-4 transform transition-transform duration-500 ease-in-out ' +
          (isVisible
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:-translate-x-full md:translate-y-0')
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-center pt-6">
          <p className="text-xl font-normal tracking-fine text-paper">
            {t('category_label', 'Category')}
          </p>
        </div>
        <div className="mx-auto grid max-w-80 grid-cols-2 gap-x-15 gap-y-6 pt-6 pb-25 md:pb-12">
          {categories.map(cat => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={close}
              className="group flex flex-col items-center"
            >
              <div className="flex size-27.5 items-center justify-center rounded-full bg-paper transition-colors duration-200 group-hover:bg-brand">
                {cat.icon ? (
                  <div className="relative size-15">
                    <Image
                      src={cat.icon}
                      alt={cat.label}
                      fill
                      sizes="60px"
                      className="object-contain"
                    />
                  </div>
                ) : null}
              </div>
              <p className="mt-2.5 text-center text-base leading-4 font-bold whitespace-pre-line text-paper uppercase">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
};

export default CategoryFilter;
