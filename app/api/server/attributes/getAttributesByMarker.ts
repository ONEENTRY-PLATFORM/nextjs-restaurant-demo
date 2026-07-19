import { unstable_cache } from 'next/cache';
import type { IAttributesSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type AttributesResult = {
  isError: boolean;
  error?: IError;
  attributes?: IAttributesSetsEntity[];
};

const fetchAttributesByMarker = unstable_cache(
  async (attributeMarker: string): Promise<AttributesResult> => {
    try {
      const data = await getApi().AttributesSets.getAttributesByMarker(attributeMarker);
      if (isError(data)) {
        return { isError: true, error: data as IError };
      }
      // SDK d.ts mistypes this method as `IAttributeSetsEntity[]` (a set), but it returns
      // attributes (`IAttributesSetsEntity[]`) — cast once here at the SDK boundary.
      return { isError: false, attributes: data as unknown as IAttributesSetsEntity[] };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getAttributesByMarker'],
  { revalidate: 300, tags: ['oneentry', 'oneentry-attributes'] }
);

/**
 * getAttributesByMarker — attributes from attribute sets by marker.
 *
 * @param   {object} props                 - Fetch arguments.
 * @param   {string} props.attributeMarker - Marker of the attribute set whose attributes are returned.
 * @returns Promise resolving to `{ isError, error?, attributes? }` (graceful fallback on SDK error).
 */
export const getAttributesByMarker = cache(
  async ({ attributeMarker }: { attributeMarker: string }): Promise<AttributesResult> =>
    fetchAttributesByMarker(attributeMarker)
);
