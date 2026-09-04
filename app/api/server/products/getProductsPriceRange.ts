import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api/api/api';
import { PAGES } from '@/app/utils/constants';

export type PriceRange = {
  min: number;
  max: number;
};

const fetchProductsPriceRange = unstable_cache(
  async (pageUrl: string, lang: string): Promise<PriceRange> => {
    try {
      const data = await getApi().Products.getProductsPriceByPageUrl(pageUrl, lang);
      if (isError(data)) {
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
  },
  ['oneentry-getProductsPriceRange'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-products'] }
);

/**
 * getProductsPriceRange — catalog min/max price via `Products.getProductsPriceByPageUrl` (lightweight `{id, price}[]`).
 *
 * @param   {string}              [pageUrl]  - OneEntry `pageUrl` of the catalog page (default `'services'`).
 * @param   {string}              [langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to the catalog price range.
 */
export const getProductsPriceRange = cache(
  async (pageUrl: string = PAGES.menu, langCode?: string): Promise<PriceRange> =>
    fetchProductsPriceRange(pageUrl, langCode || getLang())
);
