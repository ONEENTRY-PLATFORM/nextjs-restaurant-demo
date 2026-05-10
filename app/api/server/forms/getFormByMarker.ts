import type { IError } from 'oneentry/dist/base/utils';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getFormByMarker — form by marker.
 *
 * @param   {string} marker - OneEntry form marker (e.g. `review_form`, `contact_us`).
 * @returns Promise resolving to `{ isError, error?, form? }` (graceful fallback on SDK error).
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
