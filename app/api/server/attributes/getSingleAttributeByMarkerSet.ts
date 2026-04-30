import type { IAttributesSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  attributeMarker: string;
  setMarker: string;
}
/**
 * Получает один атрибут с данными из attribute sets.
 */
export const getSingleAttributeByMarkerSet = async ({
  attributeMarker,
  setMarker,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  attribute?: IAttributesSetsEntity;
}> => {
  try {
    const attribute = await api.AttributesSets.getSingleAttributeByMarkerSet(
      setMarker,
      attributeMarker,
    );

    if (typeError(attribute)) {
      return { isError: true, error: attribute as IError };
    } else {
      return { isError: false, attribute: attribute };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
