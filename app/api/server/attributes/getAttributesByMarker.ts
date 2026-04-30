import type { IAttributeSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';

import { api } from '@/app/api';
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
      await api.AttributesSets.getAttributesByMarker(attributeMarker);

    if (typeError(data)) {
      return { isError: true, error: data as IError };
    } else {
      return { isError: false, attributes: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
