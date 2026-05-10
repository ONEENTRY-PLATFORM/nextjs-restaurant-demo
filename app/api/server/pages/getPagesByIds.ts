import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getPagesByIds — pages by an array of ids.
 *
 * @param   {number[]} ids - Array of OneEntry page ids fetched in parallel.
 * @returns {Promise<{ isError: boolean; error?: IError; pages?: IPagesEntity[] }>}      Promise resolving to `{ isError, error?, pages? }` (graceful fallback on SDK error).
 */
export const getPagesByIds = cache(
  async (
    ids: []
  ): Promise<{
    isError: boolean;
    error?: IError;
    pages?: IPagesEntity[];
  }> => {
    try {
      const data = await Promise.all(
        ids.map(async (id: number) => {
          const page = await getApi().Pages.getPageById(id);
          return page;
        })
      ).then(results => results);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, pages: data as IPagesEntity[] };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
