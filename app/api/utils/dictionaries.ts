import 'server-only';

import type { IAttributeValues } from 'oneentry/dist/base/utils';

import getCachedData from './getCachedData';
import { getAttributesByMarker } from '../server/attributes/getAttributesByMarker';

/**
 * Get dictionary
 * @param locale
 *
 */
export const getDictionary = async () => {
  try {
    // get block by marker from api
    const { attributes } = await getCachedData(
      'dictionary',
      async () => await getAttributesByMarker({attributeMarker: 'static_content'}),
    );    

    return attributes;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};
