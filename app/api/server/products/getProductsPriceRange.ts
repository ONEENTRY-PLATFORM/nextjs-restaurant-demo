import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

export type PriceRange = {
  min: number;
  max: number;
};

/**
 * getProductsPriceRange — min/max цена каталога через `Products.getProductsPriceByPageUrl` (лёгкий `{id, price}[]`).
 *
 * Используется для динамической сборки чипов цены в фильтре, чтобы границы соответствовали реальным товарам.
 * Graceful fallback `{ min: 0, max: 0 }` при пустом каталоге или ошибке — UI чипы тогда просто не покажутся.
 */
export const getProductsPriceRange = cache(
  async (pageUrl = 'services', langCode?: string): Promise<PriceRange> => {
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
