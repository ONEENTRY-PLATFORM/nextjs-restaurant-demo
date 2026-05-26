import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import { PAGES } from '@/app/utils/constants';
import { typeError } from '@/components/utils';

export type PriceRange = {
  min: number;
  max: number;
};

/**
 * getProductsPriceRange — catalog min/max price via `Products.getProductsPriceByPageUrl` (lightweight `{id, price}[]`).
 *
 * Returns `{ min: 0, max: 0 }` on an empty catalog or error.
 *
 * @param   {string}              [pageUrl]  - OneEntry `pageUrl` of the catalog page (default `'services'`).
 * @param   {string}              [langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to the catalog price range.
 */
export const getProductsPriceRange = cache(
  async (pageUrl: string = PAGES.menu, langCode?: string): Promise<PriceRange> => {
    try {
      const data = await getApi().Products.getProductsPriceByPageUrl(
        pageUrl,
        langCode || getLang()
      );
      if (typeError(data)) {
        return { min: 0, max: 0 };
      }
      const prices = data.items
        .map(item => Number(item.price))
        .filter(p => Number.isFinite(p) && p > 0);
      if (prices.length === 0) {
        return { min: 0, max: 0 };
      }
      return {
        min: Math.floor(Math.min(...prices)),
        max: Math.ceil(Math.max(...prices)),
      };
    } catch {
      return { min: 0, max: 0 };
    }
  }
);
