import { unstable_cache } from 'next/cache';
import type { IError, IPagesEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type PageResult = {
  isError: boolean;
  error?: IError;
  page?: IPagesEntity;
};

const fetchPageByUrl = unstable_cache(
  async (url: string): Promise<PageResult> => {
    try {
      const data = await getApi().Pages.getPageByUrl(url);
      if (isError(data)) {
        return { isError: true, error: data };
      }
      return { isError: false, page: data };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getPageByUrl'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-pages'] }
);

/**
 * getPageByUrl — page by URL with attached forms, blocks, and menus.
 *
 * @param   {string} url - OneEntry `pageUrl` marker (NOT the Next.js route path).
 * @returns Promise resolving to `{ isError, error?, page? }` (graceful fallback on SDK error).
 */
export const getPageByUrl = cache(async (url: string): Promise<PageResult> => fetchPageByUrl(url));
