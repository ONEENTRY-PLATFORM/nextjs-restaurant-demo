import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает все связанные объекты Products через API.
 */
export const getRelatedProductsById = async (
  id: number,
): Promise<{
  isError: boolean;
  error?: IError;
  products?: IProductsEntity[];
  total: number;
}> => {
  try {
    const data = await api.Products.getRelatedProductsById(id);

    if (typeError(data)) {
      return { isError: true, error: data as IError, total: 0 };
    } else {
      return {
        isError: false,
        products: data.items,
        total: data.total,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e, total: 0 };
  }
};
