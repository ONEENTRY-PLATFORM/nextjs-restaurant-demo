import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getPageByUrl — page by URL with attached forms, blocks, and menus (React cache() deduplicates calls within a render).
 *
 * @param   {string} url - OneEntry `pageUrl` marker (NOT the Next.js route path).
 * @returns Promise resolving to `{ isError, error?, page? }` (graceful fallback on SDK error).
 */
export const getPageByUrl = cache(
  async (
    url: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    page?: IPagesEntity;
  }> => {
    try {
      const data = await getApi().Pages.getPageByUrl(url);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, page: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
