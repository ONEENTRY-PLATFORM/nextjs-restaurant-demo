import type { IError } from 'oneentry/dist/base/utils';
import type { IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/** getBlocksByPageUrl — all blocks for the given page url (React cache() deduplicates calls within a render). */
export const getBlocksByPageUrl = cache(
  async (
    pageUrl: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    blocks?: IPositionBlock[];
  }> => {
    try {
      const data = await getApi().Pages.getBlocksByPageUrl(pageUrl);

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
