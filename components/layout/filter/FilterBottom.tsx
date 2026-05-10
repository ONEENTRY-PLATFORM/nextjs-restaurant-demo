'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type JSX, useContext, useEffect, useRef, useState } from 'react';

import type { PriceRange } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import CloseXIcon from '@/components/icons/close-x';
import type { PreferenceOption } from '@/components/layout/header/CategoriesScroller';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

const WAITING_TIME: Array<{ label: string; max: number | null }> = [
  { label: 'Under 30 mins', max: 30 },
  { label: 'Under 60 mins', max: 60 },
  { label: 'doesn’t matter', max: null },
];
type PriceChip = {
  label: string;
  key: 'minPrice' | 'maxPrice';
  value: number;
};

/**
 * buildPriceChips — builds the catalog price filter chips from the `{ min, max }` range.
 *
 * @param   {PriceRange | undefined} priceRange - Catalog price bounds.
 * @returns Array of `PriceChip` items (empty when the range is missing or trivial).
 */
const buildPriceChips = (priceRange?: PriceRange): PriceChip[] => {
  if (!priceRange || priceRange.max <= 0) return [];
  const chips: PriceChip[] = [];
  if (priceRange.min > 0) {
    chips.push({
      label: `from ${priceRange.min}`,
      key: 'minPrice',
      value: priceRange.min,
    });
  }
  if (priceRange.max > priceRange.min) {
    chips.push({
      label: `Under ${priceRange.max}`,
      key: 'maxPrice',
      value: priceRange.max,
    });
  }
  return chips;
};

/**
 * FilterBottom — bottom filter sheet (mobile) / right-side panel (md+), toggled via `OpenDrawerContext`.
 *
 * @param   {object}                  props               - Component props.
 * @param   {PreferenceOption[]}      [props.preferences] - Available preference filter options sourced from OneEntry.
 * @param   {PriceRange}              [props.priceRange]  - Optional catalog price range used to seed the price chips.
 * @returns JSX of the filter panel.
 */
const FilterBottom = ({
  preferences: preferenceOptions = [],
  priceRange,
}: {
  preferences?: PreferenceOption[];
  priceRange?: PriceRange;
}): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setComponent } = useContext(OpenDrawerContext);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [waitingTime, setWaitingTime] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [price, setPrice] = useState<string[]>([]);
  const priceChips = buildPriceChips(priceRange);

  const waitingTitle = t('order_waiting_time', 'Order waiting time');
  const preferencesTitle = t('preferences_text', 'Preferences');
  const clearAllLabel = t('clear_all_filters_text', 'Clear all filters');

  const isVisible = open && component === 'FilterForm';

  // Hydrate local state from the URL only on the transition to visible
  // so that fast router re-renders don't overwrite user edits.
  useEffect(() => {
    if (!isVisible) return;
    const cookingMax = searchParams.get('cooking_time_max');
    const matchedTime = WAITING_TIME.find(t => t.max !== null && String(t.max) === cookingMax);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWaitingTime(matchedTime?.label ?? null);

    const prefsParam = searchParams.get('preferences') ?? '';
    setPreferences(
      prefsParam
        ? prefsParam
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
        : []
    );

    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');
    setPrice(
      priceChips
        .filter(({ key, value }) =>
          key === 'minPrice' ? min === String(value) : max === String(value)
        )
        .map(p => p.label)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const close = (): void => {
    setOpen(false);
    setComponent('');
  };

  const sheetRef = useRef<HTMLDivElement | null>(null);
  useSwipeToClose(sheetRef, close);

  // On reopen, clear inline styles left over from swipe-dismiss, otherwise
  // the Tailwind class `translate-y-0` is overridden by an inline `transform`.
  useEffect(() => {
    if (isVisible && sheetRef.current) {
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
  }, [isVisible]);

  const togglePreference = (item: string): void => {
    setPreferences(prev => (prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]));
  };

  const togglePrice = (label: string): void => {
    setPrice(prev => (prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]));
  };

  const reset = (): void => {
    setWaitingTime(null);
    setPreferences([]);
    setPrice([]);
  };

  // Serialize selected chips into the URL and update the route;
  // `/shop/...` page components are already `force-dynamic`.
  const apply = (): void => {
    const params = new URLSearchParams(searchParams.toString());

    const time = WAITING_TIME.find(t => t.label === waitingTime);
    if (time?.max != null) {
      params.set('cooking_time_max', String(time.max));
    } else {
      params.delete('cooking_time_max');
    }

    if (preferences.length > 0) {
      params.set('preferences', preferences.join(','));
    } else {
      params.delete('preferences');
    }

    const minChip = priceChips.find(p => p.key === 'minPrice' && price.includes(p.label));
    if (minChip) {
      params.set('minPrice', String(minChip.value));
    } else {
      params.delete('minPrice');
    }
    const maxChip = priceChips.find(p => p.key === 'maxPrice' && price.includes(p.label));
    if (maxChip) {
      params.set('maxPrice', String(maxChip.value));
    } else {
      params.delete('maxPrice');
    }

    const qs = params.toString();
    // If the user applied a filter outside `/shop`, send them to `/shop`,
    // otherwise stay on the current route via replace.
    const isShopRoute = pathname.startsWith('/shop');
    const targetPath = isShopRoute ? pathname : '/shop';
    const url = qs ? `${targetPath}?${qs}` : targetPath;
    if (isShopRoute) {
      router.replace(url);
    } else {
      router.push(url);
    }
    close();
  };

  const itemClass = (active: boolean): string =>
    'filter_item' + (active ? ' bg-brand text-white border-brand' : '');

  return (
    <>
      <div
        onClick={close}
        className={
          'fixed inset-0 z-10 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ' +
          (isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden="true"
      />
      <div
        id="side-menu"
        ref={sheetRef}
        className={
          'fixed bottom-0 left-0 h-dvh w-full overflow-y-auto bg-ink/80 backdrop-blur-card z-20 pt-6.5 px-5 transform transition-transform duration-500 ease-in-out rounded-tl-[20px] rounded-tr-[20px] ' +
          'md:left-auto md:right-0 md:bottom-0 md:top-0 md:h-screen md:w-95 md:max-w-95 md:rounded-tr-none md:rounded-bl-[20px] md:rounded-tl-[20px] md:overflow-y-auto ' +
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
            className="group_white max-md:hidden"
          >
            <ArrowBackOrangeIcon />
          </button>
          <p className="font-normal text-2xl text-white">Filter</p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="group_white max-md:hidden"
          >
            <CloseXIcon />
          </button>
        </div>
        <div className="max-w-89 mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            className="filter_btn text-base border-b border-white pb-0.75 hover:text-brand hover:border-brand"
          >
            {clearAllLabel}
          </button>
          <button
            type="button"
            onClick={apply}
            className="filter_btn text-brand border border-brand rounded-card px-5 hover_btn_white"
          >
            Apply
          </button>
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-9.25 gap-1.75">
          <p className="filter_title">{waitingTitle}</p>
          {WAITING_TIME.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setWaitingTime(prev => (prev === label ? null : label))}
              className={itemClass(waitingTime === label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-5.25 gap-1.75">
          <p className="filter_title">{preferencesTitle}</p>
          {preferenceOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => togglePreference(option.value)}
              className={itemClass(preferences.includes(option.value))}
            >
              {option.title}
            </button>
          ))}
        </div>
        <div className="max-w-89 mx-auto flex flex-wrap mt-5.25 gap-1.75 pb-7.5">
          <p className="filter_title">Price $</p>
          {priceChips.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => togglePrice(label)}
              className={itemClass(price.includes(label))}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="h-25 bg-transparent border-none md:hidden"></div>
      </div>
    </>
  );
};

export default FilterBottom;
