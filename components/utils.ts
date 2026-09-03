import type { IAttributeValues, IFormAttribute, IMenusPages } from 'oneentry/types';

import { CurrencyEnum, IntlEnum } from '@/app/types/enum';
import type { ScheduleSlotEntry } from '@/components/reservation/RestaurantSelect';

/**
 * getFormAttributes — normalizes `form.attributes` from `Forms.getFormByMarker` into an array.
 *
 * The API returns an array of fields for a populated form but an empty object (`{}`) for a form
 * without fields — since SDK 1.0.158 the SDK normalizes that empty object to `[]` itself, leaving
 * this helper the shapes it does not cover. Copies the value into a fresh array when it is already
 * an array (safe to sort in place — the RTK cache entity is frozen), unwraps an object map via
 * `Object.values`, and falls back to an empty list for a missing form.
 *
 * @param   {{ attributes?: unknown } | undefined | null} form - Form entity from `getFormByMarker` (or any object carrying `attributes`).
 * @returns Fresh array of form attributes (empty when the form has no fields).
 */
export const getFormAttributes = (
  form: { attributes?: unknown } | undefined | null
): IFormAttribute[] => {
  const attrs: unknown = form?.attributes;
  if (Array.isArray(attrs)) return [...attrs] as IFormAttribute[];
  if (attrs && typeof attrs === 'object') return Object.values(attrs) as IFormAttribute[];
  return [];
};

/** RichTextBlock — one block of a OneEntry `text` attribute value. */
export type RichTextBlock = { htmlValue?: string; plainValue?: string; mdValue?: string };

/**
 * unwrapRichText — first block of a OneEntry `text` attribute value.
 *
 * The API may deliver the value as an array of blocks or as a single object — unwraps both shapes
 * universally (`Array.isArray(raw) ? raw[0] : raw`) and returns `undefined` for anything else.
 *
 * @param   {unknown} raw - Raw `attributeValues.<marker>.value` of a `text` attribute.
 * @returns First rich-text block, or `undefined` when the value carries none.
 */
export const unwrapRichText = (raw: unknown): RichTextBlock | undefined => {
  const block: unknown = Array.isArray(raw) ? raw[0] : raw;
  return block && typeof block === 'object' ? (block as RichTextBlock) : undefined;
};

/**
 * pickRichTextHtml — extracts meaningful HTML from a OneEntry `text` attribute value.
 *
 * Unwraps the value via {@link unwrapRichText}, then treats `<p><br></p>` and similar empty
 * rich-text payloads as no content (returns `''`), so callers can short-circuit rendering of the
 * surrounding section.
 *
 * @param   {unknown} raw - Raw attribute value (OneEntry rich-text array or single block object).
 * @returns HTML string, or `''` when the value is missing/empty/whitespace-only.
 */
export const pickRichTextHtml = (raw: unknown): string => {
  const html = unwrapRichText(raw)?.htmlValue ?? '';
  return /\S/.test(html.replace(/<[^>]*>/g, '')) ? html : '';
};

/**
 * parseScheduleSlots — unwraps a raw `timeInterval` attribute value (e.g. the restaurant `schedule`)
 * into a flat list of slot entries.
 *
 * Accepts the SDK shape `[{ values: ScheduleSlotEntry[] }, …]`, flattens `values` across all
 * groups, and returns an empty list for a missing or non-array value.
 *
 * @param   {unknown} raw - Raw `schedule.value` from `attributeValues`.
 * @returns Flat array of schedule slot entries (empty when nothing parseable is present).
 */
export const parseScheduleSlots = (raw: unknown): ScheduleSlotEntry[] =>
  Array.isArray(raw)
    ? (raw as Array<{ values?: ScheduleSlotEntry[] }>).flatMap(group => group?.values ?? [])
    : [];

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
 * flatMenuToNested — turns a flat menu list into a tree keyed by `parentId` + `parentType`.
 *
 * Page ids and custom-item ids come from different sequences and overlap, so `parentId` alone
 * addresses a parent ambiguously: a child declares which kind of parent it points at in
 * `parentType`, matching the parent's own `itemType`. Both fields are optional in the SDK
 * response — when either side omits one, matching falls back to `parentId` only.
 *
 * @param   {[] | Array<IMenusPages>}       data    - Flat array of menu pages from the OneEntry SDK.
 * @param   {number | null}                 pid     - Parent id to root the tree at (`null` for top-level).
 * @param   {'page' | 'custom' | undefined} [ptype] - `itemType` of the parent the children must point at.
 * @returns Array of nested menu pages with populated `children`.
 */
export const flatMenuToNested = (
  data: [] | Array<IMenusPages>,
  pid: number | null,
  ptype?: IMenusPages['itemType']
) => {
  return data.reduce((r: IMenusPages[], element: IMenusPages) => {
    const typeMatches = !ptype || !element.parentType || element.parentType === ptype;
    if (pid == element.parentId && typeMatches) {
      const object = { ...element };
      /**
       * The Menus API may already hand back a tree. Prefer the children it sent
       * over rebuilding them from `parentId`: reconstruction searches the FLAT
       * list, so against a tree response it finds nothing and the real submenu
       * silently disappears. Every menu arrives flat today — each `parentId` is
       * null and each `children` an empty array — which is exactly what keeps
       * this latent instead of visibly broken.
       */
      const apiChildren = Array.isArray(element.children)
        ? element.children
        : element.children
          ? [element.children as IMenusPages]
          : [];
      const children = apiChildren.length
        ? apiChildren
        : flatMenuToNested(data, element.id, element.itemType);
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
