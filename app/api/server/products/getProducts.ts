import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api, getLang } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';
import { typeError } from '@/components/utils';

/**
 * Получает все продукты с пагинацией и фильтром.
 */
export const getProducts = async (props: {
  limit: number;
  offset: number;
  langCode?: string;
  params?: {
    handle?: string;
    searchParams?: {
      search?: string;
      in_stock?: string;
      color?: string;
      preferences?: string;
      minPrice?: string;
      maxPrice?: string;
    };
  };
}): Promise<{
  isError: boolean;
  error?: IError;
  products?: IProductsEntity[];
  total: number;
}> => {
  const { limit, offset, langCode, params } = props;
  const expandedFilters = getSearchParams(params?.searchParams, params?.handle);

  try {
    const data = await api.Products.getProducts(
      expandedFilters,
      langCode || getLang(),
      // Sort key/order настраивается в OneEntry admin —
      // опуская `sortKey`/`sortOrder`, мы позволяем серверу применить то,
      // что выбрал редактор, и учесть per-product position-локи.
      { offset, limit },
    );
    if (typeError(data)) {
      return { isError: true, error: data, total: 0 };
    } else {
      return {
        isError: false,
        products: data.items,
        total: data.total,
      };
    }
  } catch (error) {
    return {
      isError: true,
      error: error as IError,
      total: 0,
    };
  }
};
