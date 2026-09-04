import { unstable_cache } from 'next/cache';
import type { IError, IProductsEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, isError } from '@/app/api/api/api';

type RelatedProductsResult = {
  isError: boolean;
  error?: IError;
  products?: IProductsEntity[];
  total: number;
};

const fetchRelatedProductsById = unstable_cache(
  async (id: number): Promise<RelatedProductsResult> => {
    try {
      const data = await getApi().Products.getRelatedProductsById(id);

      if (isError(data)) {
        return { isError: true, error: data as IError, total: 0 };
      } else {
        return {
          isError: false,
          products: data.items,
          total: data.total,
        };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError, total: 0 };
    }
  },
  ['oneentry-getRelatedProductsById'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-products'] }
);

/**
 * getRelatedProductsById — all related products by id.
 *
 * @param   {number} id - OneEntry product id whose related items are requested.
 * @returns Promise resolving to `{ isError, error?, products?, total }` (graceful fallback on SDK error).
 */
export const getRelatedProductsById = cache(async (id: number): Promise<RelatedProductsResult> =>
  fetchRelatedProductsById(id)
);
