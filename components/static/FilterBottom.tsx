'use client';

import { type JSX, useContext, useState } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

const WAITING_TIME = ['Under 30 mins', 'Under 60 mins', 'doesn’t matter'];
const PREFERENCES = [
  'Meat',
  'Fish',
  'Vegetable',
  'Sugar Free',
  'Gluten free',
  'Bland',
  'Law Salt',
  'Law Fat',
  'Vegetarian',
  'Spicy dish',
  'Diabetic',
];
const PRICE = ['from 5', 'Under 30'];

/**
 * Filter bottom sheet — 1:1 port of `static-html/index_filter.html` `#side-menu`.
 *
 * Toggled by {@link FilterButton} via `OpenDrawerContext`. Mounted in the
 * header so the panel is reachable from any page. Renders as a slide-up
 * sheet on mobile and a centered panel on md+ screens.
 * @returns {JSX.Element} Filter panel JSX.
 */
const FilterBottom = (): JSX.Element => {
  const { open, component, setOpen, setComponent } =
    useContext(OpenDrawerContext);
  const [waitingTime, setWaitingTime] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [price, setPrice] = useState<string | null>(null);

  const isVisible = open && component === 'FilterForm';

  const close = (): void => {
    setOpen(false);
    setComponent('');
  };

  const togglePreference = (item: string): void => {
    setPreferences((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const reset = (): void => {
    setWaitingTime(null);
    setPreferences([]);
    setPrice(null);
  };

  const apply = (): void => {
    close();
  };

  const itemClass = (active: boolean): string =>
    'filter_item' + (active ? ' bg-[#ec722b] text-white border-[#ec722b]' : '');

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
      <div
        id="side-menu"
        className={
          'fixed bottom-0 left-0 w-full bg-[rgba(76,77,86,0.8)] backdrop-blur-[10px] z-20 pt-[26px] px-5 transform transition-transform duration-500 ease-in-out rounded-tl-[20px] rounded-tr-[20px] ' +
          'md:left-auto md:right-0 md:bottom-0 md:top-0 md:w-95 md:h-screen md:max-w-95 md:rounded-tr-none md:rounded-bl-[20px] md:rounded-tl-[20px] md:overflow-y-auto ' +
          (isVisible
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full')
        }
      >
        <div className="max-w-89 mx-auto flex justify-between items-center mb-5">
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
          <p className="font-normal text-[24px] text-white">Filter</p>
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
        <div className="max-w-89 mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            className="filter_btn text-[16px] border-b border-white pb-[3px] hover:text-[#ec722b] hover:border-[#ec722b]"
          >
            Clear all Filters
          </button>
          <button
            type="button"
            onClick={apply}
            className="filter_btn text-[#ec722b] border border-[#ec722b] rounded-[5px] px-5 hover_btn_white"
          >
            Apply
          </button>
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-[37px] gap-[7px]">
          <p className="filter_title">Order waiting time</p>
          {WAITING_TIME.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setWaitingTime((prev) => (prev === item ? null : item))
              }
              className={itemClass(waitingTime === item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-[21px] gap-[7px]">
          <p className="filter_title">Preferences</p>
          {PREFERENCES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => togglePreference(item)}
              className={itemClass(preferences.includes(item))}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-[21px] gap-[7px] pb-7.5">
          <p className="filter_title">Price $</p>
          {PRICE.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPrice((prev) => (prev === item ? null : item))}
              className={itemClass(price === item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="h-[100px] bg-transparent border-none md:hidden"></div>
      </div>
    </>
  );
};

export default FilterBottom;
