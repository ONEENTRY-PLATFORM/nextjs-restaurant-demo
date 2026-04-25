'use client';

import { type JSX, useContext, useState } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import CloseXIcon from '@/components/icons/close-x';

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
          'fixed bottom-0 left-0 w-full bg-[rgba(76,77,86,0.8)] backdrop-blur-[10px] z-20 pt-6.5 px-5 transform transition-transform duration-500 ease-in-out rounded-tl-[20px] rounded-tr-[20px] ' +
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
            <ArrowBackOrangeIcon />
          </button>
          <p className="font-normal text-[24px] text-white">Filter</p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="group_white"
          >
            <CloseXIcon />
          </button>
        </div>
        <div className="max-w-89 mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            className="filter_btn text-[16px] border-b border-white pb-0.75 hover:text-[#ec722b] hover:border-[#ec722b]"
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
        <div className="max-w-89 mx-auto flex flex-wrap mt-9.25 gap-1.75">
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
        <div className="max-w-89 mx-auto flex flex-wrap mt-5.25 gap-1.75">
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
        <div className="max-w-89 mx-auto flex flex-wrap mt-5.25 gap-1.75 pb-7.5">
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
        <div className="h-25 bg-transparent border-none md:hidden"></div>
      </div>
    </>
  );
};

export default FilterBottom;
