import type { IError } from 'oneentry/dist/base/utils';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает форму по маркеру.
 */
export const getFormByMarker = cache(
  async (
    marker: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    form?: IFormsEntity;
  }> => {
    try {
      const data = await getApi().Forms.getFormByMarker(marker);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, form: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
