import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi, isError } from '@/app/api';

type ProductResult = {
  isError: boolean;
  error?: IError;
  product?: IProductsEntity;
};

const fetchProductById = unstable_cache(
  async (id: number): Promise<ProductResult> => {
    try {
      const data = await getApi().Products.getProductById(id);

      if (isError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, product: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getProductById'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-products'] }
);

/**
 * getProductById — product by id.
 *
 * @param   {number} id - OneEntry product id.
 * @returns Promise resolving to `{ isError, error?, product? }` (graceful fallback on SDK error).
 */
export const getProductById = cache(async (id: number): Promise<ProductResult> =>
  fetchProductById(id)
);
