import { unstable_cache } from 'next/cache';
import type { IError, IPagesEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api/api/api';

type PageResult = {
  isError: boolean;
  error?: IError;
  page?: IPagesEntity;
};

const fetchPageById = unstable_cache(
  async (id: number): Promise<PageResult> => {
    try {
      const data = await getApi().Pages.getPageById(id);

      if (isError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, page: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getPageById'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-pages'] }
);

/**
 * getPageById — page with attached forms, blocks, and menus.
 *
 * @param   {number} id - OneEntry page id.
 * @returns Promise resolving to `{ isError, error?, page? }` (graceful fallback on SDK error).
 */
export const getPageById = cache(async (id: number): Promise<PageResult> => fetchPageById(id));
