import type { IAttributeSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/** getAttributesByMarker — attributes from attribute sets by marker. */
export const getAttributesByMarker = cache(
  async ({
    attributeMarker,
  }: {
    attributeMarker: string;
  }): Promise<{
    isError: boolean;
    error?: IError;
    attributes?: IAttributeSetsEntity[];
  }> => {
    try {
      const data = await getApi().AttributesSets.getAttributesByMarker(attributeMarker);

      if (typeError(data)) {
        return { isError: true, error: data as IError };
      } else {
        return { isError: false, attributes: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
