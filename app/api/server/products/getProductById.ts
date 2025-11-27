import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Get product by id.
 */
export const getProductById = async (
  id: number,
): Promise<{
  isError: boolean;
  error?: IError;
  product?: IProductsEntity;
}> => {
  try {
    const data = await api.Products.getProductById(id);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, product: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
