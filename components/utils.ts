import type { IAttributeValues, IError } from 'oneentry/dist/base/utils';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';

import { CurrencyEnum, IntlEnum } from '@/app/types/enum';

/**
 * dictText — pulls a string value from the `static_content` dictionary by marker with a fallback.
 * @example const title = dictText(dict, 'leave_review_button', 'Leave a review');
 * @param   {IAttributeValues|undefined} dict     - Dictionary (attribute set `static_content`).
 * @param   {string}                     marker   - Attribute marker.
 * @param   {string}                     fallback - Value used when the marker or its string value is missing.
 * @returns {string}                              Localized string or `fallback`.
 */
export const dictText = (
  dict: IAttributeValues | undefined,
  marker: string,
  fallback: string
): string => {
  const raw = (dict?.[marker] as { value?: unknown } | undefined)?.value;
  return typeof raw === 'string' ? raw : fallback;
};

/** UsePrice — formats a number as a currency string. */
export const UsePrice = ({ amount }: { amount: number | string }): string => {
  const currency = CurrencyEnum['en' as keyof typeof CurrencyEnum];
  const intlEnum = IntlEnum['en' as keyof typeof IntlEnum];
  const formattedPrice = new Intl.NumberFormat(intlEnum, {
    style: 'currency',
    currency: currency,
  }).format(Number(amount));

  return formattedPrice;
};

/** UseDate — formats a date as a `dd-MMM-yyyy` string. */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sortArrayByPosition = (array: Record<any, any>) => {
  return array.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
};

export const sortObjectFieldsByPosition = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<any, any> | null | undefined
) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  const entries = Object.entries(obj);
  entries.sort((a, b) => (a[1]?.position ?? 0) - (b[1]?.position ?? 0));
  const sortedObj = {};
  for (const [key, value] of entries) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    sortedObj[key] = value;
  }
  return sortedObj;
};

/** flatMenuToNested — turns a flat menu list into a tree keyed by `parentId`. */
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

/** typeError — type guard for `IError` (based on the presence of `statusCode`). */
export function typeError(res: IError | unknown): res is IError {
  if ((res as IError)?.statusCode) {
    return true;
  }
  return false;
}

/**
 * normalizePhoneE164 — normalizes a phone to E.164 (`/^\+[0-9]{10,15}$/`) for OneEntry.
 * Returns an empty string as `''` — the caller decides whether to send it.
 * @param   {string|undefined|null} raw - Raw value from the phone input.
 * @returns {string}                    `+<digits>` or `''`.
 */
export const normalizePhoneE164 = (raw: string | undefined | null): string => {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

export const shuffleArray = <T>(array: T[]): T[] => {
  return array
    .map(a => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value);
};
