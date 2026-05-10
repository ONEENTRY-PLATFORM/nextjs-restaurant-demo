import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * getProductById — product by id.
 *
 * @param   {number} id - OneEntry product id.
 * @returns {Promise<{ isError: boolean; error?: IError; product?: IProductsEntity }>}    Promise resolving to `{ isError, error?, product? }` (graceful fallback on SDK error).
 */
export const getProductById = cache(
  async (
    id: number
  ): Promise<{
    isError: boolean;
    error?: IError;
    product?: IProductsEntity;
  }> => {
    try {
      const data = await getApi().Products.getProductById(id);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, product: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
