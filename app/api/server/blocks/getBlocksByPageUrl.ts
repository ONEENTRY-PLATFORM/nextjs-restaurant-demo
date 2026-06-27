import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type BlocksResult = {
  isError: boolean;
  error?: IError;
  blocks?: IPositionBlock[];
};

const fetchBlocksByPageUrl = unstable_cache(
  async (pageUrl: string): Promise<BlocksResult> => {
    try {
      const data = await getApi().Pages.getBlocksByPageUrl(pageUrl);
      if (isError(data)) {
        return { isError: true, error: data };
      }
      return { isError: false, blocks: data };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getBlocksByPageUrl'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-blocks'] }
);

/**
 * getBlocksByPageUrl — all blocks for the given page url.
 *
 * @param   {string} pageUrl - OneEntry `pageUrl` marker (NOT the Next.js route path).
 * @returns Promise resolving to `{ isError, error?, blocks? }` (graceful fallback on SDK error).
 */
export const getBlocksByPageUrl = cache(
  async (pageUrl: string): Promise<BlocksResult> => fetchBlocksByPageUrl(pageUrl)
);
