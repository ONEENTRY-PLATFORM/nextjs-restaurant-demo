'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

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
            <svg
              className="fill-[#EC722B] hover-target"
              width="26"
              height="20"
              viewBox="0 0 26 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5271 0.532945C11.1788 0.1917 10.7065 0 10.214 0C9.72159 0 9.2493 0.1917 8.90103 0.532945L0.543755 8.72407C0.195589 9.06542 0 9.52832 0 10.011C0 10.4937 0.195589 10.9566 0.543755 11.2979L8.90103 19.489C9.25129 19.8206 9.72042 20.0041 10.2074 19.9999C10.6943 19.9958 11.1601 19.8043 11.5044 19.4669C11.8488 19.1294 12.0441 18.6728 12.0483 18.1956C12.0526 17.7183 11.8654 17.2585 11.5271 16.9152L6.4997 11.8312H24.1428C24.6354 11.8312 25.1078 11.6395 25.456 11.2981C25.8043 10.9567 26 10.4937 26 10.011C26 9.52823 25.8043 9.06524 25.456 8.72388C25.1078 8.38251 24.6354 8.19074 24.1428 8.19074H6.4997L11.5271 3.10678C11.8752 2.76543 12.0708 2.30253 12.0708 1.81986C12.0708 1.3372 11.8752 0.874292 11.5271 0.532945Z"
                fill="#EC722B"
              />
            </svg>
          </button>
          <p className="font-normal text-[20px] tracking-[0.02em] text-[#dfe9f9]">
            Category
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="group_white"
          >
            <svg
              className="stroke-[#EC722B] hover-target"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2L18 18M18 2L2 18"
                stroke="#EC722B"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
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
                  'w-[110px] h-[110px] rounded-full flex items-center justify-center ' +
                  (cat.highlight ? 'bg-[#ec722b]' : 'bg-[#dfe9f9]')
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
              <p className="font-bold uppercase text-[16px] text-[#dfe9f9] mt-2.5 leading-4 text-center whitespace-pre-line">
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
