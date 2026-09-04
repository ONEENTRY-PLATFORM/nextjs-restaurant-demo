import { unstable_cache } from 'next/cache';
import type { BlockType, IBlocksResponse, IError } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api/api/api';

type BlocksResult = {
  isError: boolean;
  error?: IError;
  blocks?: IBlocksResponse;
};

const fetchBlocks = unstable_cache(
  async (type: BlockType): Promise<BlocksResult> => {
    try {
      const data = await getApi().Blocks.getBlocks(type);

      if (isError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, blocks: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getBlocks'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-blocks'] }
);

/**
 * getBlocks — blocks by type.
 *
 * @param   {object}    props      - Fetch arguments.
 * @param   {BlockType} props.type - OneEntry block type filter.
 * @returns Promise resolving to `{ isError, error?, blocks? }` (graceful fallback on SDK error).
 */
export const getBlocks = cache(async ({ type }: { type: BlockType }): Promise<BlocksResult> =>
  fetchBlocks(type)
);
