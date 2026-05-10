import type { IError } from 'oneentry/dist/base/utils';
import type { BlockType, IBlocksResponse } from 'oneentry/dist/blocks/blocksInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getBlocks — blocks by type.
 *
 * @param   {object}    props      - Fetch arguments.
 * @param   {BlockType} props.type - OneEntry block type filter.
 * @returns Promise resolving to `{ isError, error?, blocks? }` (graceful fallback on SDK error).
 */
export const getBlocks = cache(
  async ({
    type,
  }: {
    type: BlockType;
  }): Promise<{
    isError: boolean;
    error?: IError;
    blocks?: IBlocksResponse;
  }> => {
    try {
      const data = await getApi().Blocks.getBlocks(type);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, blocks: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
