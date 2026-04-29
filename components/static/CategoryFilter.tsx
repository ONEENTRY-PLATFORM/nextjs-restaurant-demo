'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { type JSX, useContext, useMemo } from 'react';

import { getImageUrl } from '@/app/api';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import CloseXIcon from '@/components/icons/close-x';

type Category = {
  label: string;
  icon: string;
  href: string;
};

// Trailing CTA — not a menu category, kept hardcoded because it lives
// outside the `menu` page tree (links to /reservation).
const BOOKING_TILE: Category = {
  label: 'BOOKING\nTABLE',
  icon: '/images/icons/categories/booking_table.svg',
  href: '/reservation',
};

/**
 * CategoryFilter — left-side slide-in panel listing the menu categories
 * fetched from OneEntry (child pages of the `menu` page) plus a trailing
 * "Booking Table" CTA. Mirrors `static-html/about_category.html`
 * `<!-- category -->` block.
 *
 * Toggled via {@link OpenDrawerContext} with `component === 'CategoryFilter'`.
 * Triggered from the desktop header burger button.
 * @param   {object}          props       - Component props.
 * @param   {IPagesEntity[]}  props.pages - Child pages of the `menu` page
 *                                          (categories), supplied by the
 *                                          server `Header`.
 * @returns {JSX.Element}                 Category panel JSX.
 */
const CategoryFilter = ({ pages }: { pages: IPagesEntity[] }): JSX.Element => {
  const { open, component, setOpen, setComponent } =
    useContext(OpenDrawerContext);

  const categories = useMemo<Category[]>(() => {
    const fromCms = pages
      .filter((p) => p.isVisible !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map<Category>((p) => {
        // OneEntry attribute set: `icon` (image, array shape).
        const iconAttr = p.attributeValues?.icon?.value as
          | { downloadLink?: string }
          | Array<{ downloadLink?: string }>
          | null
          | undefined;
        const cmsIcon = getImageUrl(iconAttr);
        return {
          label: (p.localizeInfos?.title ?? p.pageUrl).toUpperCase(),
          icon: cmsIcon || '/images/icons/categories/' + p.pageUrl + '.svg',
          href: '/shop/category/' + p.pageUrl,
        };
      });
    return [...fromCms, BOOKING_TILE];
  }, [pages]);

  const isVisible = open && component === 'CategoryFilter';

  const close = (): void => {
    setOpen(false);
    setComponent('');
  };

  return (
    <>
      <div
        onClick={close}
        className={
          'fixed inset-0 z-10 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ' +
          (isVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none')
        }
        aria-hidden="true"
      />
      <aside
        className={
          'fixed left-0 top-0 bottom-0 z-20 w-full md:w-100 max-w-full bg-[rgba(76,77,86,0.95)] backdrop-blur-[10px] overflow-y-auto rounded-tr-[20px] rounded-br-[20px] transform transition-transform duration-500 ease-in-out ' +
          (isVisible ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex justify-between items-center px-5 pt-6">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="group_white"
          >
            <ArrowBackOrangeIcon />
          </button>
          <p className="font-normal text-[20px] tracking-[0.02em] text-paper">
            Category
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="group_white"
          >
            <CloseXIcon />
          </button>
        </div>
        <div className="max-w-80 mx-auto pb-12 pt-6 grid grid-cols-2 gap-x-15 gap-y-6">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={close}
              className="group flex flex-col items-center"
            >
              <div className="w-27.5 h-27.5 rounded-full flex items-center justify-center bg-paper transition-colors duration-200 group-hover:bg-brand">
                <div className="relative w-15 h-15">
                  <Image
                    src={cat.icon}
                    alt={cat.label}
                    fill
                    sizes="60px"
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="font-bold uppercase text-[16px] text-paper mt-2.5 leading-4 text-center whitespace-pre-line">
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
