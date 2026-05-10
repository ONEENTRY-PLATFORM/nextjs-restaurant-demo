import 'server-only';

import type { IAttributeValue, IAttributeValues } from 'oneentry/dist/base/utils';

import { dictText } from '@/components/utils';

import { getAttributesByMarker } from './api/server/attributes/getAttributesByMarker';
import getCachedData from './api/utils/getCachedData';

/**
 * fetchDictionary — loads the `static_content` attribute set and normalizes it.
 *
 * The attribute set's `value` field is a localization map; in this project it
 * is currently empty `{}`, so in the normalized record `value` is filled from
 * `initialValue` (the English default from the admin panel).
 *
 * @returns {Promise<IAttributeValues>} Promise resolving to a map of markers → attribute with a string `value`.
 */
const fetchDictionary = async (): Promise<IAttributeValues> => {
  try {
    const { isError, attributes } = await getAttributesByMarker({
      attributeMarker: 'static_content',
    });

    if (isError || !Array.isArray(attributes)) {
      return {} as IAttributeValues;
    }

    const dict = {} as IAttributeValues;
    for (const raw of attributes as unknown as Array<{
      marker: string;
      value?: unknown;
      initialValue?: string;
    }>) {
      const isEmpty =
        raw.value == null ||
        (typeof raw.value === 'object' && Object.keys(raw.value as object).length === 0);
      dict[raw.marker] = {
        ...raw,
        value: isEmpty ? (raw.initialValue ?? '') : raw.value,
      } as unknown as IAttributeValue;
    }
    return dict;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return {} as IAttributeValues;
  }
};

/**
 * getDictionary — cached `static_content` dictionary for use in server components.
 *
 * @returns {Promise<IAttributeValues>} Promise resolving to the cached normalized dictionary map.
 */
export const getDictionary = async (): Promise<IAttributeValues> =>
  getCachedData('dictionary', fetchDictionary);

/**
 * t — server-side counterpart of `useT()`: reads a string from the
 * `static_content` dictionary by marker with a fallback, without threading
 * `dict` through props. Internally calls the cached `getDictionary`, so
 * repeat calls are cheap. Use in server components instead of
 * `dictText(dict, marker, fallback)` with an explicit `await getDictionary()`.
 *
 * @example
 *   const title = await t('featured_objects', 'Featured objects');
 *
 * @param   {string}          marker   - Dictionary marker (attribute name).
 * @param   {string}          fallback - Returned when the marker is missing.
 * @returns {Promise<string>}            Promise resolving to the dictionary string for the marker, or the fallback.
 */
export const t = async (marker: string, fallback: string): Promise<string> => {
  const dict = await getDictionary();
  return dictText(dict, marker, fallback);
};
