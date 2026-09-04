import { unstable_cache } from 'next/cache';
import type { IError, IMenusEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api/api/api';

type MenuResult = {
  isError: boolean;
  error?: IError;
  menu?: IMenusEntity;
};

const fetchMenuByMarker = unstable_cache(
  async (marker: string): Promise<MenuResult> => {
    try {
      const data = await getApi().Menus.getMenusByMarker(marker);
      if (isError(data)) {
        return { isError: true, error: data };
      }
      return { isError: false, menu: data };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getMenuByMarker'],
  { revalidate: 300, tags: ['oneentry', 'oneentry-menus'] }
);

/**
 * getMenuByMarker — menu pages by marker.
 *
 * @param   {string} marker - OneEntry menu marker (e.g. `main-menu`).
 * @returns Promise resolving to `{ isError, error?, menu? }` (graceful fallback on SDK error).
 */
export const getMenuByMarker = cache(async (marker: string): Promise<MenuResult> =>
  fetchMenuByMarker(marker)
);
