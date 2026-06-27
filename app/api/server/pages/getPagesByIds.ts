import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

/**
 * getPagesByIds — pages by an array of ids.
 *
 * @param   {number[]} ids - Array of OneEntry page ids fetched in parallel.
 * @returns Promise resolving to `{ isError, error?, pages? }` (graceful fallback on SDK error).
 */
export const getPagesByIds = cache(
  async (
    ids: number[]
  ): Promise<{
    isError: boolean;
    error?: IError;
    pages?: IPagesEntity[];
  }> => {
    try {
      const results = await Promise.all(
        ids.map(async id => {
          const page = await getApi().Pages.getPageById(id);
          // Guard per page: Promise.all returns an array, so a global isError
          // check never fires — an errored page would otherwise leak through.
          return isError(page) ? null : (page as IPagesEntity);
        })
      );
      const pages = results.filter((page): page is IPagesEntity => page !== null);
      return { isError: false, pages };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
