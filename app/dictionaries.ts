import 'server-only';

import type { IAttributeValue, IAttributeValues } from 'oneentry/types';
import { cache } from 'react';

import { dictText } from '@/components/utils';

import { getAttributesByMarker } from './api/server/attributes/getAttributesByMarker';
import { ATTRS } from './utils/constants';

/**
 * fetchDictionary — loads the `static_content` attribute set and normalizes it.
 *
 * @returns Promise resolving to a map of markers → attribute with a string `value`.
 */
const fetchDictionary = async (): Promise<IAttributeValues> => {
  try {
    const { isError, attributes } = await getAttributesByMarker({
      attributeMarker: ATTRS.staticContent,
    });

    if (isError || !Array.isArray(attributes)) {
      return {} as IAttributeValues;
    }

    const dict = {} as IAttributeValues;
    for (const raw of attributes) {
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
 * @returns Promise resolving to the cached normalized dictionary map.
 */
export const getDictionary = cache(fetchDictionary);

/**
 * t — server-side counterpart of `useT()`: reads a string from the `static_content` dictionary by marker with a fallback.
 *
 * @example
 *   const title = await t('featured_objects', 'Featured objects');
 *
 * @param   {string}          marker   - Dictionary marker (attribute name).
 * @param   {string}          fallback - Returned when the marker is missing.
 * @returns Promise resolving to the dictionary string for the marker, or the fallback.
 */
export const t = async (marker: string, fallback: string): Promise<string> => {
  const dict = await getDictionary();
  return dictText(dict, marker, fallback);
};
