import type { ReadonlyURLSearchParams } from 'next/navigation';

import type { PreferenceOption } from '@/components/layout/header/CategoriesScroller';

export const WAITING_TIME: Array<{ label: string; max: number | null }> = [
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
export const groupByExtended = (
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
 * sanitizePriceInput — keeps only digits in a free-text price input.
 *
 * @param   {string} raw - The raw input value from the user.
 * @returns Digit-only string (may be empty).
 */
export const sanitizePriceInput = (raw: string): string => raw.replace(/[^0-9]/g, '');

/** Local filter-panel state serialized into the URL on Apply. */
export type FilterState = {
  waitingTime: string | null;
  filters: string[];
  priceMin: string;
  priceMax: string;
};

/**
 * buildFilterParams — serializes the filter-panel state into URL search params.
 *
 * Clones the current params, drops `page` (filters invalidate the offset), then sets/deletes
 * `cooking_time_max`, `filter`, `minPrice`, `maxPrice` based on the selected state.
 *
 * @param   {ReadonlyURLSearchParams} searchParams - Current route search params.
 * @param   {FilterState}             state        - Selected waiting time / chips / price bounds.
 * @returns A new `URLSearchParams` ready to stringify onto the target route.
 */
export const buildFilterParams = (
  searchParams: ReadonlyURLSearchParams,
  state: FilterState
): URLSearchParams => {
  const params = new URLSearchParams(searchParams.toString());

  // Changing filters invalidates the current page offset — drop `page` so the
  // grid reloads from the first page (see LoadMore/Pagination `?page=` writers).
  params.delete('page');

  const time = WAITING_TIME.find(t => t.label === state.waitingTime);
  if (time?.max != null) {
    params.set('cooking_time_max', String(time.max));
  } else {
    params.delete('cooking_time_max');
  }

  if (state.filters.length > 0) {
    params.set('filter', state.filters.join(','));
  } else {
    params.delete('filter');
  }

  const minValue = Number(state.priceMin);
  if (state.priceMin && Number.isFinite(minValue) && minValue > 0) {
    params.set('minPrice', String(minValue));
  } else {
    params.delete('minPrice');
  }
  const maxValue = Number(state.priceMax);
  if (state.priceMax && Number.isFinite(maxValue) && maxValue > 0) {
    params.set('maxPrice', String(maxValue));
  } else {
    params.delete('maxPrice');
  }

  return params;
};
