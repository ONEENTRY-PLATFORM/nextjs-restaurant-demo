import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api, getLang } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';
import { typeError } from '@/components/utils';

/**
 * Get all products with pagination and filter.
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
      // Sort key/order is configured in OneEntry admin —
      // omitting `sortKey`/`sortOrder` lets the server apply whatever
      // the editor selected and honors per-product position locks.
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
