import 'server-only';

import { getAttributesByMarker } from '../server/attributes/getAttributesByMarker';
import getCachedData from './getCachedData';

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
      async () =>
        await getAttributesByMarker({ attributeMarker: 'static_content' }),
    );

    return attributes;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
};
