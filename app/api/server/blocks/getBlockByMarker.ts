import { unstable_cache } from 'next/cache';
import type { IBlockEntity, IError } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api/api/api';

type BlockResult = {
  isError: boolean;
  error?: IError;
  block?: IBlockEntity;
};

const fetchBlockByMarker = unstable_cache(
  async (marker: string): Promise<BlockResult> => {
    try {
      const data = await getApi().Blocks.getBlockByMarker(marker);

      if (isError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, block: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getBlockByMarker'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-blocks'] }
);

/**
 * getBlockByMarker — block by marker.
 *
 * @param   {string} marker - OneEntry block marker.
 * @returns Promise resolving to `{ isError, error?, block? }` (graceful fallback on SDK error).
 */
export const getBlockByMarker = cache(async (marker: string): Promise<BlockResult> =>
  fetchBlockByMarker(marker)
);
