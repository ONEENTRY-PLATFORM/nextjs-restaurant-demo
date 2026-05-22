import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

type MenuResult = {
  isError: boolean;
  error?: IError;
  menu?: IMenusEntity;
};

const fetchMenuByMarker = unstable_cache(
  async (marker: string): Promise<MenuResult> => {
    try {
      const data = await getApi().Menus.getMenusByMarker(marker);
      if (typeError(data)) {
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
 * Composed cache (see {@link import('../pages/getPageByUrl').getPageByUrl}):
 * `unstable_cache` for 300 s cross-request caching (menus change rarely),
 * React `cache()` for in-render deduplication.
 *
 * @param   {string} marker - OneEntry menu marker (e.g. `main-menu`).
 * @returns Promise resolving to `{ isError, error?, menu? }` (graceful fallback on SDK error).
 */
export const getMenuByMarker = cache(
  async (marker: string): Promise<MenuResult> => fetchMenuByMarker(marker)
);
