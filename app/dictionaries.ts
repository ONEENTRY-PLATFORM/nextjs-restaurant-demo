/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

import type { IAttributeValues } from 'oneentry/dist/base/utils';

import { getBlockByMarker } from '@/app/api/';

/**
 * Get dictionary from block by marker
 *
 * @returns Current lang dictionary
 */
const dict = async (): Promise<any> => {
  try {
    const langCode = 'en_US';

    // get block by marker from api
    const { block } = await getBlockByMarker('static_content');

    // extract block attribute values
    const blockValues =
      block?.attributeValues[langCode] || block?.attributeValues;

    return { ...(blockValues as IAttributeValues) };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

/**
 * Get dictionary
 * @param locale
 *
 * @returns Current lang dictionary
 */
export const getDictionary = async () => dict();
