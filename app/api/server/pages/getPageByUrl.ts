import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
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
 * Composed cache: `unstable_cache` keeps the OneEntry response in the
 * Next.js data cache for 60 s across requests, and React `cache()` adds
 * in-render deduplication on top.
 *
 * @param   {string} url - OneEntry `pageUrl` marker (NOT the Next.js route path).
 * @returns Promise resolving to `{ isError, error?, page? }` (graceful fallback on SDK error).
 */
export const getPageByUrl = cache(async (url: string): Promise<PageResult> => fetchPageByUrl(url));
