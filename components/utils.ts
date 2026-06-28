import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';

import { CurrencyEnum, IntlEnum } from '@/app/types/enum';

/**
 * dictText — pulls a string value from the `static_content` dictionary by marker with a fallback.
 *
 * @example const title = dictText(dict, 'leave_review_button', 'Leave a review');
 *
 * @param   {IAttributeValues | undefined} dict     - Dictionary (attribute set `static_content`).
 * @param   {string}                       marker   - Attribute marker.
 * @param   {string}                       fallback - Value used when the marker or its string value is missing.
 * @returns Localized string or `fallback`.
 */
export const dictText = (
  dict: IAttributeValues | undefined,
  marker: string,
  fallback: string
): string => {
  const raw = (dict?.[marker] as { value?: unknown } | undefined)?.value;
  return typeof raw === 'string' ? raw : fallback;
};

/**
 * UsePrice — formats a number as a currency string (project locale + currency).
 *
 * Uses `props.currency` (the real currency reported by the OneEntry order/preview response) when it is a
 * non-empty ISO-4217 code; OneEntry often returns an empty string, so it falls back to `CurrencyEnum.en`.
 * Whole amounts drop the fractional part (`$11.00` → `$11`); amounts with cents keep two digits (`$16.50`).
 *
 * @param   {object}          props            - Function props.
 * @param   {number | string} props.amount     - Numeric (or numeric-string) amount to format.
 * @param   {string}          [props.currency] - ISO-4217 currency code from OneEntry (`order.currency` / `preview.currency`); falls back to USD when empty/missing.
 * @returns Locale-formatted currency string.
 */
export const UsePrice = ({
  amount,
  currency,
}: {
  amount: number | string;
  currency?: string | undefined;
}): string => {
  const resolvedCurrency =
    currency && currency.trim() ? currency.trim() : CurrencyEnum['en' as keyof typeof CurrencyEnum];
  const intlEnum = IntlEnum['en' as keyof typeof IntlEnum];
  const value = Number(amount);
  const formattedPrice = new Intl.NumberFormat(intlEnum, {
    style: 'currency',
    currency: resolvedCurrency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

  return formattedPrice;
};

/**
 * UseDate — formats a date as a `dd-MMM-yyyy` string in the requested locale.
 *
 * @param   {object}                       props          - Function props.
 * @param   {number | string | Date}       props.fullDate - Date to format (ms timestamp, ISO string, or `Date`).
 * @param   {string}                       props.format   - Locale identifier passed to `Intl.DateTimeFormat` (defaults to `'en'`).
 * @returns Formatted `dd-MMM-yyyy` string.
 */
export const UseDate = ({
  fullDate,
  format = 'en',
}: {
  fullDate: number | string | Date;
  format: string;
}) => {
  const d = new Date(fullDate);
  const year = new Intl.DateTimeFormat(format, {
    year: 'numeric',
  }).format(d);
  const month = new Intl.DateTimeFormat(format, {
    month: 'short',
  }).format(d);
  const day = new Intl.DateTimeFormat(format, {
    day: '2-digit',
  }).format(d);

  const date = day + '-' + month + '-' + year;

  return date;
};

/**
 * sortArrayByPosition — in-place ascending sort by the `position` field.
 *
 * @param   {T[]} array - Array of items, each carrying a numeric `position`.
 * @returns The same array sorted in ascending `position` order.
 */
export const sortArrayByPosition = <T extends { position: number }>(array: T[]): T[] => {
  return array.sort((a, b) => a.position - b.position);
};

/**
 * sortObjectFieldsByPosition — returns a copy of the object with keys ordered by each value's `position`.
 *
 * @param   {Record<string, T> | null | undefined} obj - Map whose values carry a numeric `position` (missing → `0`).
 * @returns New object with the same keys/values ordered by ascending `position`.
 */
export const sortObjectFieldsByPosition = <T>(
  obj: Record<string, T> | null | undefined
): Record<string, T> => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const entries = Object.entries(obj);
  const positionOf = (v: T): number => (v as { position?: number })?.position ?? 0;
  entries.sort((a, b) => positionOf(a[1]) - positionOf(b[1]));
  const sortedObj: Record<string, T> = {};
  for (const [key, value] of entries) {
    sortedObj[key] = value;
  }
  return sortedObj;
};

/**
 * flatMenuToNested — turns a flat menu list into a tree keyed by `parentId`.
 *
 * @param   {[] | Array<IMenusPages>} data - Flat array of menu pages from the OneEntry SDK.
 * @param   {number | null}           pid  - Parent id to root the tree at (`null` for top-level).
 * @returns Array of nested menu pages with populated `children`.
 */
export const flatMenuToNested = (data: [] | Array<IMenusPages>, pid: number | null) => {
  return data.reduce((r: IMenusPages[], element: IMenusPages) => {
    if (pid == element.parentId) {
      const object = { ...element };
      const children = flatMenuToNested(data, element.id);
      if (children.length) {
        object.children = children;
      }
      r.push(object);
    }
    return r;
  }, []);
};

/**
 * normalizePhoneE164 — normalizes a phone to E.164 (`/^\+[0-9]{10,15}$/`) for OneEntry.
 *
 * Returns an empty string as `''` — the caller decides whether to send it.
 *
 * @param   {string | undefined | null} raw - Raw value from the phone input.
 * @returns `+<digits>` string, or empty string when no digits are present.
 */
export const normalizePhoneE164 = (raw: string | undefined | null): string => {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

/**
 * shuffleArray — returns a new array with the elements of `array` in random order.
 *
 * @param   {T[]} array - Source array (left untouched).
 * @returns New array containing the same elements shuffled.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  return array
    .map(a => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value);
};
