import type { IError } from 'oneentry/dist/base/utils';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/** getBlockByMarker — блок по маркеру. */
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

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, block: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
