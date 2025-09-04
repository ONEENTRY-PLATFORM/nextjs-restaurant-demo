/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';

import { getAttributesByMarker } from './api/server/attributes/getAttributesByMarker';
import { IAttributeValues } from 'oneentry/dist/base/utils';

/**
 * Get dictionary from attributes by marker
 *
 * @returns Current lang dictionary
 */
const dict = async (): Promise<any> => {
  try {
    // get attributes by marker from api
    const { attributes } = await getAttributesByMarker({attributeMarker: 'static_content'});
    
    return attributes;
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
