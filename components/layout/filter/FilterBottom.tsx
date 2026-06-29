'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type JSX, useContext, useEffect, useRef, useState } from 'react';

import { useGetProductsPriceRangeQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import CloseXIcon from '@/components/icons/close-x';
import {
  buildFilterParams,
  sanitizePriceInput,
  WAITING_TIME,
} from '@/components/layout/filter/filterBottomUtils';
import FilterChipGroups from '@/components/layout/filter/FilterChipGroups';
import type { PreferenceOption } from '@/components/layout/header/CategoriesScroller';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/**
 * FilterBottom — bottom filter sheet (mobile) / right-side panel (md+), toggled via `OpenDrawerContext`.
 *
 * @param   {object}                  props           - Component props.
 * @param   {PreferenceOption[]}      [props.filters] - Available `filter` (course/meal-type) options sourced from OneEntry.
 * @returns JSX of the filter panel.
 */
const FilterBottom = ({
  filters: filterOptions = [],
}: {
  filters?: PreferenceOption[];
}): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setComponent } = useContext(OpenDrawerContext);
  const isVisible = open && component === 'FilterForm';
  // Lazy-load the catalog price range only on first filter-popup open — avoids
  // the SSR `getProductsPriceRange` round-trip on every initial page render.
  const { data: priceRange } = useGetProductsPriceRangeQuery({}, { skip: !isVisible });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [waitingTime, setWaitingTime] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  const waitingTitle = t('order_waiting_time', 'Order waiting time');
  const filtersTitle = t('preferences_text', 'Preferences');
  const clearAllLabel = t('clear_all_filters_text', 'Clear all filters');
  const fromLabel = t('price_from_text', 'from');
  const underLabel = t('price_under_text', 'Under');

  // Hydrate local state from the URL only on the transition to visible
  // so that fast router re-renders don't overwrite user edits.
  useEffect(() => {
    if (!isVisible) return;
    const cookingMax = searchParams.get('cooking_time_max');
    const matchedTime = WAITING_TIME.find(t => t.max !== null && String(t.max) === cookingMax);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWaitingTime(matchedTime?.label ?? null);

    const filterParam = searchParams.get('filter') ?? '';
    setFilters(
      filterParam
        ? filterParam
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
        : []
    );

    setPriceMin(searchParams.get('minPrice') ?? '');
    setPriceMax(searchParams.get('maxPrice') ?? '');
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

  const toggleFilter = (item: string): void => {
    setFilters(prev => (prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]));
  };

  const reset = (): void => {
    setWaitingTime(null);
    setFilters([]);
    setPriceMin('');
    setPriceMax('');
  };

  // Serialize selected chips into the URL and update the route;
  // `/shop/...` page components are already `force-dynamic`.
  const apply = (): void => {
    const params = buildFilterParams(searchParams, { waitingTime, filters, priceMin, priceMax });
    const qs = params.toString();
    // Stay on the current route only when it actually renders a filtered listing
    // (`/shop`, `/shop/<handle>`, `/shop/category/<handle>`). The product page
    // `/shop/product/<handle>` also starts with `/shop` but ignores `filter`, so
    // applying a filter there must navigate to `/shop` instead of silently
    // replacing the URL on a page that won't react to it.
    const isProductRoute = pathname.startsWith('/shop/product');
    const isListingRoute = pathname.startsWith('/shop') && !isProductRoute;
    const targetPath = isListingRoute ? pathname : '/shop';
    const url = qs ? `${targetPath}?${qs}` : targetPath;
    if (isListingRoute) {
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
          'fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ' +
          (isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden="true"
      />
      <div
        id="side-menu"
        ref={sheetRef}
        className={
          'fixed flex flex-col bottom-0 left-0 min-h-[80vh] max-h-dvh w-full overflow-y-auto bg-ink/80 backdrop-blur-card z-100 py-6.5 px-5 transform transition-transform duration-500 ease-in-out rounded-tl-[20px] rounded-tr-[20px] ' +
          'md:left-auto md:right-0 md:bottom-0 md:top-0 md:w-100 md:max-w-100 md:rounded-tr-none md:rounded-bl-[20px] md:rounded-tl-[20px] md:overflow-y-auto ' +
          (isVisible
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full')
        }
      >
        <div className="mb-8 flex w-full items-center justify-between">
          <button
            type="button"
            onClick={close}
            aria-label={t('back_text', 'Back')}
            className="group_white max-md:hidden"
          >
            <ArrowBackOrangeIcon />
          </button>
          {/* Mobile-only spacer balances the close button so the title stays centered (the back arrow is desktop-only). */}
          <span aria-hidden="true" className="size-5 md:hidden" />
          <p className="text-2xl font-normal text-white">{t('filter_panel_title', 'Filter')}</p>
          <button
            type="button"
            onClick={close}
            aria-label={t('close_label', 'Close')}
            className="group_white"
          >
            <CloseXIcon />
          </button>
        </div>
        <div className="w-full md:order-2">
          <div className="mt-9.25 flex flex-wrap gap-1.75 md:mt-0">
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
          {filterOptions.length > 0 ? (
            <FilterChipGroups
              title={filtersTitle}
              options={filterOptions}
              selected={filters}
              onToggle={toggleFilter}
              itemClass={itemClass}
            />
          ) : null}
          <div className="mt-5.25 flex flex-wrap gap-1.75 pb-7.5">
            <p className="filter_title">{t('filter_price_title', 'Price $')}</p>
            <label className="filter_item flex items-center gap-1.5 hover:border-paper hover:bg-transparent active:bg-transparent">
              <span>{fromLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMin}
                onChange={e => setPriceMin(sanitizePriceInput(e.target.value))}
                placeholder={priceRange?.min ? String(priceRange.min) : '0'}
                aria-label={`${fromLabel} price`}
                className="w-12 border-0 bg-transparent text-paper outline-none placeholder:text-paper/50"
              />
            </label>
            <label className="filter_item flex items-center gap-1.5 hover:border-paper hover:bg-transparent active:bg-transparent">
              <span>{underLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMax}
                onChange={e => setPriceMax(sanitizePriceInput(e.target.value))}
                placeholder={priceRange?.max ? String(priceRange.max) : '0'}
                aria-label={`${underLabel} price`}
                className="w-12 border-0 bg-transparent text-paper outline-none placeholder:text-paper/50"
              />
            </label>
          </div>
        </div>
        <div className="mt-auto flex w-full items-center justify-between md:order-1 md:mt-0 md:mb-8">
          <button
            type="button"
            onClick={reset}
            className="filter_btn border-b border-white pb-0.75 text-base transition-colors duration-200 hover:border-brand hover:text-brand"
          >
            {clearAllLabel}
          </button>
          <button
            type="button"
            onClick={apply}
            className="filter_btn hover_btn_brand rounded-card border border-brand px-5 text-brand"
          >
            {t('apply_text', 'Apply')}
          </button>
        </div>
        <div className="h-25 border-none bg-transparent md:hidden"></div>
      </div>
    </>
  );
};

export default FilterBottom;
