'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type JSX, useContext, useEffect, useRef, useState } from 'react';

import { useGetProductsPriceRangeQuery } from '@/app/api';
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

/**
 * groupByExtended — partitions chip options into ordered groups by their `group` field.
 *
 * Preserves the input order (which mirrors `listTitles[].position` from OneEntry) both inside each
 * group and across groups (a group's bucket appears at the position of its first option). Options
 * without a group fall into a synthetic `''` bucket rendered last and without a subheader.
 *
 * @param   {PreferenceOption[]} options - Chip options from OneEntry.
 * @returns Ordered array of `{ name, items }` buckets.
 */
const groupByExtended = (
  options: PreferenceOption[]
): Array<{ name: string; items: PreferenceOption[] }> => {
  const order: string[] = [];
  const buckets = new Map<string, PreferenceOption[]>();
  for (const option of options) {
    const key = option.group ?? '';
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)!.push(option);
  }
  // If at least one option carries a group, push the ungrouped bucket to the end so it doesn't
  // visually split the named sections; otherwise the natural ordering is preserved.
  const hasNamed = order.some(k => k !== '');
  const finalOrder = hasNamed
    ? [...order.filter(k => k !== ''), ...order.filter(k => k === '')]
    : order;
  return finalOrder
    .map(name => ({ name, items: buckets.get(name) ?? [] }))
    .filter(g => g.items.length > 0);
};

/**
 * FilterChipGroups — chip list grouped by `option.group` for the OneEntry `filter` attribute.
 *
 * Renders the section title once at the top, then for each group emits a small uppercase subheader
 * (`option.group`) followed by a row of toggleable chips. When no option declares a group, falls
 * back to a single ungrouped row to stay compatible with flat list attributes.
 *
 * @param   {object}              props           - Component props.
 * @param   {string}              props.title     - Parent section title (e.g. "Categories").
 * @param   {PreferenceOption[]}  props.options   - All chip options.
 * @param   {string[]}            props.selected  - Currently selected `value`s.
 * @param   {(v: string) => void} props.onToggle  - Toggle handler for a chip.
 * @param   {(active: boolean) => string} props.itemClass - Class builder for chip active/idle state.
 * @returns JSX of the grouped chip block.
 */
const FilterChipGroups = ({
  title,
  options,
  selected,
  onToggle,
  itemClass,
}: {
  title: string;
  options: PreferenceOption[];
  selected: string[];
  onToggle: (value: string) => void;
  itemClass: (active: boolean) => string;
}): JSX.Element => {
  const groups = groupByExtended(options);
  return (
    <div className="mt-5.25 flex flex-col gap-3.75">
      <p className="filter_title">{title}</p>
      {groups.map(group => (
        <div key={group.name || '_'} className="flex flex-col gap-1.75">
          {group.name ? (
            <p className="text-xs uppercase tracking-wide text-paper/80">{group.name}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.75">
            {group.items.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={itemClass(selected.includes(option.value))}
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

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
  const filtersTitle = t('filters_text', 'Preferences');
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

  /**
   * sanitizePriceInput — keeps only digits in a free-text price input.
   *
   * @param   {string} raw - The raw input value from the user.
   * @returns Digit-only string (may be empty).
   */
  const sanitizePriceInput = (raw: string): string => raw.replace(/[^0-9]/g, '');

  const reset = (): void => {
    setWaitingTime(null);
    setFilters([]);
    setPriceMin('');
    setPriceMax('');
  };

  // Serialize selected chips into the URL and update the route;
  // `/shop/...` page components are already `force-dynamic`.
  const apply = (): void => {
    const params = new URLSearchParams(searchParams.toString());

    // Changing filters invalidates the current page offset — drop `page` so the
    // grid reloads from the first page (see LoadMore/Pagination `?page=` writers).
    params.delete('page');

    const time = WAITING_TIME.find(t => t.label === waitingTime);
    if (time?.max != null) {
      params.set('cooking_time_max', String(time.max));
    } else {
      params.delete('cooking_time_max');
    }

    if (filters.length > 0) {
      params.set('filter', filters.join(','));
    } else {
      params.delete('filter');
    }

    const minValue = Number(priceMin);
    if (priceMin && Number.isFinite(minValue) && minValue > 0) {
      params.set('minPrice', String(minValue));
    } else {
      params.delete('minPrice');
    }
    const maxValue = Number(priceMax);
    if (priceMax && Number.isFinite(maxValue) && maxValue > 0) {
      params.set('maxPrice', String(maxValue));
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
          'fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ' +
          (isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden="true"
      />
      <div
        id="side-menu"
        ref={sheetRef}
        className={
          'fixed flex flex-col bottom-0 left-0 min-h-[80vh] w-full overflow-y-auto bg-ink/80 backdrop-blur-card z-100 py-6.5 px-5 transform transition-transform duration-500 ease-in-out rounded-tl-[20px] rounded-tr-[20px] ' +
          'md:left-auto md:right-0 md:bottom-0 md:top-0 md:w-100 md:max-w-100 md:rounded-tr-none md:rounded-bl-[20px] md:rounded-tl-[20px] md:overflow-y-auto ' +
          (isVisible
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full')
        }
      >
        <div className="w-full flex justify-between items-between mb-8">
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
        <div className="w-full md:order-2">
          <div className="flex flex-wrap mt-9.25 md:mt-0 gap-1.75">
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
          <div className="flex flex-wrap mt-5.25 gap-1.75 pb-7.5">
            <p className="filter_title">Price $</p>
            <label className="filter_item flex items-center gap-1.5 hover:bg-transparent active:bg-transparent hover:border-paper">
              <span>{fromLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMin}
                onChange={e => setPriceMin(sanitizePriceInput(e.target.value))}
                placeholder={priceRange?.min ? String(priceRange.min) : '0'}
                aria-label={`${fromLabel} price`}
                className="bg-transparent border-0 outline-none w-12 text-paper placeholder:text-paper/50"
              />
            </label>
            <label className="filter_item flex items-center gap-1.5 hover:bg-transparent active:bg-transparent hover:border-paper">
              <span>{underLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMax}
                onChange={e => setPriceMax(sanitizePriceInput(e.target.value))}
                placeholder={priceRange?.max ? String(priceRange.max) : '0'}
                aria-label={`${underLabel} price`}
                className="bg-transparent border-0 outline-none w-12 text-paper placeholder:text-paper/50"
              />
            </label>
          </div>
        </div>
        <div className="w-full mt-auto md:mt-0 md:mb-8 md:order-1 flex justify-between items-center">
          <button
            type="button"
            onClick={reset}
            className="filter_btn text-base border-b border-white pb-0.75 transition-colors duration-200 hover:text-brand hover:border-brand"
          >
            {clearAllLabel}
          </button>
          <button
            type="button"
            onClick={apply}
            className="filter_btn text-brand border border-brand rounded-card px-5 hover_btn_brand"
          >
            Apply
          </button>
        </div>
        <div className="h-25 bg-transparent border-none md:hidden"></div>
      </div>
    </>
  );
};

export default FilterBottom;
