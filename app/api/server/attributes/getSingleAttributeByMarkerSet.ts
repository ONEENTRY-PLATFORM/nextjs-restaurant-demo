import { unstable_cache } from 'next/cache';
import type { IAttributesSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  attributeMarker: string;
  setMarker: string;
}

type AttributeResult = {
  isError: boolean;
  error?: IError;
  attribute?: IAttributesSetsEntity;
};

const fetchSingleAttribute = unstable_cache(
  async (setMarker: string, attributeMarker: string): Promise<AttributeResult> => {
    try {
      const attribute = await getApi().AttributesSets.getSingleAttributeByMarkerSet(
        setMarker,
        attributeMarker
      );
      if (typeError(attribute)) {
        return { isError: true, error: attribute as IError };
      }
      return { isError: false, attribute };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getSingleAttributeByMarkerSet'],
  { revalidate: 300, tags: ['oneentry', 'oneentry-attributes'] }
);

/**
 * getSingleAttributeByMarkerSet — a single attribute with its data from attribute sets.
 *
 * Composed cache (see {@link import('../pages/getPageByUrl').getPageByUrl}):
 * `unstable_cache` for 300 s cross-request caching (attribute sets change
 * rarely), React `cache()` for in-render deduplication.
 *
 * @param   {HandleProps} props                 - Fetch arguments.
 * @param   {string}      props.attributeMarker - Marker of the attribute inside the set.
 * @param   {string}      props.setMarker       - Marker of the attribute set.
 * @returns Promise resolving to `{ isError, error?, attribute? }` (graceful fallback on SDK error).
 */
export const getSingleAttributeByMarkerSet = cache(
  async ({ attributeMarker, setMarker }: HandleProps): Promise<AttributeResult> =>
    fetchSingleAttribute(setMarker, attributeMarker)
);
