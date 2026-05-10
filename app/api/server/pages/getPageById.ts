import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getPageById — page with attached forms, blocks, and menus.
 *
 * @param   {number} id - OneEntry page id.
 * @returns {Promise<{ isError: boolean; error?: IError; page?: IPagesEntity }>}    Promise resolving to `{ isError, error?, page? }` (graceful fallback on SDK error).
 */
export const getPageById = cache(
  async (
    id: number
  ): Promise<{
    isError: boolean;
    error?: IError;
    page?: IPagesEntity;
  }> => {
    try {
      const data = await getApi().Pages.getPageById(id);

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
