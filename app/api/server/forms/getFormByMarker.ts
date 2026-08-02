import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type FormResult = {
  isError: boolean;
  error?: IError;
  form?: IFormsEntity;
};

const fetchFormByMarker = unstable_cache(
  async (marker: string): Promise<FormResult> => {
    try {
      const data = await getApi().Forms.getFormByMarker(marker);

      if (isError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, form: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getFormByMarker'],
  { revalidate: 300, tags: ['oneentry', 'oneentry-forms'] }
);

/**
 * getFormByMarker — form by marker.
 *
 * @param   {string} marker - OneEntry form marker (e.g. `review_form`, `contact_us`).
 * @returns Promise resolving to `{ isError, error?, form? }` (graceful fallback on SDK error).
 */
export const getFormByMarker = cache(async (marker: string): Promise<FormResult> =>
  fetchFormByMarker(marker)
);
