import type { IError } from 'oneentry/dist/base/utils';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

/**
 * getBlockByMarker — block by marker.
 *
 * @param   {string} marker - OneEntry block marker.
 * @returns Promise resolving to `{ isError, error?, block? }` (graceful fallback on SDK error).
 */
export const getBlockByMarker = cache(
  async (
    marker: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    block?: IBlockEntity;
  }> => {
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
  }
);
