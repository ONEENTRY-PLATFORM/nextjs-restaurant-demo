import type { IError } from 'oneentry/dist/base/utils';
import type {
  BlockType,
  IBlocksResponse,
} from 'oneentry/dist/blocks/blocksInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  type: BlockType;
}

/**
 * Получает блоки по параметрам.
 */
export const getBlocks = async ({
  type,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  blocks?: IBlocksResponse;
}> => {
  try {
    const data = await api.Blocks.getBlocks(type);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, blocks: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
