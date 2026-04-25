'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import CloseXIcon from '@/components/icons/close-x';

type Category = {
  label: string;
  icon: string;
  href: string;
  highlight?: boolean;
};

const CATEGORIES: Category[] = [
  {
    label: 'FIRST\nCOURSES',
    icon: '/images/icons/first_courses.svg',
    href: '/shop/category/first_courses',
  },
  {
    label: 'MAIN\nCOURSES',
    icon: '/images/icons/main_courses.svg',
    href: '/shop/category/main_courses',
  },
  {
    label: 'SALADS',
    icon: '/images/icons/salads.svg',
    href: '/shop/category/salads',
  },
  {
    label: 'SNACKES',
    icon: '/images/icons/snackes.svg',
    href: '/shop/category/snackes',
  },
  {
    label: 'HOT\nBEVERAGES',
    icon: '/images/icons/hot_beverages.svg',
    href: '/shop/category/hot_beverages',
  },
  {
    label: 'FRESH\nJUICE',
    icon: '/images/icons/fresh_juice.svg',
    href: '/shop/category/fresh_juice',
  },
  {
    label: 'DESSERT',
    icon: '/images/icons/dessert.svg',
    href: '/shop/category/desserts',
  },
  {
    label: 'APPETIZERS',
    icon: '/images/icons/appetizers.svg',
    href: '/shop/category/appetizers',
  },
  {
    label: 'KIDS MENU',
    icon: '/images/icons/kids_menu.svg',
    href: '/shop/category/kids_menu',
  },
  {
    label: 'BOOKING\nTABLE',
    icon: '/images/icons/booking_table.svg',
    href: '/reservation',
    highlight: true,
  },
];

/**
 * CategoryFilter — left-side slide-in panel listing 10 category circles.
 * Mirrors `static-html/about_category.html` `<!-- category -->` block.
 *
 * Toggled via {@link OpenDrawerContext} with `component === 'CategoryFilter'`.
 * Triggered from the desktop header burger button.
 * @returns {JSX.Element} Category panel JSX.
 */
const CategoryFilter = (): JSX.Element => {
  const { open, component, setOpen, setComponent } =
    useContext(OpenDrawerContext);

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
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={close}
              className="flex flex-col items-center"
            >
              <div
                className={
                  'w-27.5 h-27.5 rounded-full flex items-center justify-center ' +
                  (cat.highlight ? 'bg-[#ec722b]' : 'bg-paper')
                }
              >
                <Image
                  src={cat.icon}
                  alt={cat.label}
                  width={61}
                  height={61}
                  style={{ width: 'auto', height: 'auto' }}
                />
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
