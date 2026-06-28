import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type ChildPagesResult = {
  isError: boolean;
  error?: IError;
  pages?: IPagesEntity[];
};

const fetchChildPagesByParentUrl = unstable_cache(
  async (url: string): Promise<ChildPagesResult> => {
    try {
      const data = await getApi().Pages.getChildPagesByParentUrl(url);
      if (isError(data)) {
        return { isError: true, error: data };
      }
      return { isError: false, pages: data as IPagesEntity[] };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getChildPagesByParentUrl'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-pages'] }
);

/**
 * getChildPagesByParentUrl — child pages by parent url.
 *
 * @param   {string} url - OneEntry `pageUrl` marker of the parent page.
 * @returns Promise resolving to `{ isError, error?, pages? }` (graceful fallback on SDK error).
 */
export const getChildPagesByParentUrl = cache(async (url: string): Promise<ChildPagesResult> =>
  fetchChildPagesByParentUrl(url)
);
