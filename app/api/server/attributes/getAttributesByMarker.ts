import type { IAttributeSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает один атрибут с данными из attribute sets.
 */
export const getAttributesByMarker = async ({
  attributeMarker,
}: {
  attributeMarker: string;
}): Promise<{
  isError: boolean;
  error?: IError;
  attributes?: IAttributeSetsEntity[];
}> => {
  try {
    const data =
      await getApi().AttributesSets.getAttributesByMarker(attributeMarker);

    if (typeError(data)) {
      return { isError: true, error: data as IError };
    } else {
      return { isError: false, attributes: data };
    }
  } catch (e: unknown) {
    return { isError: true, error: e as IError };
  }
};
