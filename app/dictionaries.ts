import 'server-only';

import type { IAttributeValues } from 'oneentry/dist/base/utils';

import { getAttributesByMarker } from './api/server/attributes/getAttributesByMarker';

/**
 * Get dictionary from block by marker
 * @returns {Promise<IAttributeValues>} Current lang dictionary
 */
const dict = async (): Promise<IAttributeValues> => {
  try {
    // get attributes by marker from api
    const { attributes } = await getAttributesByMarker({
      attributeMarker: 'static_content',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return attributes || ({} as any);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    return {} as IAttributeValues;
  }
};

/**
 * Get dictionary
 * @returns {void} Current lang dictionary
 */
export const getDictionary = async (): Promise<IAttributeValues> => dict();
