import type { IAttributesSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  attributeMarker: string;
  setMarker: string;
}
/**
 * Получает один атрибут с данными из attribute sets.
 */
export const getSingleAttributeByMarkerSet = cache(
  async ({
    attributeMarker,
    setMarker,
  }: HandleProps): Promise<{
    isError: boolean;
    error?: IError;
    attribute?: IAttributesSetsEntity;
  }> => {
    try {
      const attribute = await getApi().AttributesSets.getSingleAttributeByMarkerSet(
        setMarker,
        attributeMarker
      );

      if (typeError(attribute)) {
        return { isError: true, error: attribute as IError };
      } else {
        return { isError: false, attribute: attribute };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
