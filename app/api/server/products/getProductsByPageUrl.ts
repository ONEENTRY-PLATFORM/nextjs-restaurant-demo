import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { api, getLang } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';
import { typeError } from '@/components/utils';

/**
 * Получает все продукты с пагинацией для выбранной категории.
 */
export const getProductsByPageUrl = async (props: {
  limit: number;
  offset: number;
  langCode?: string;
  params: {
    handle: string;
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
  const expandedFilters = getSearchParams(params.searchParams);

  try {
    const data = await api.Products.getProductsByPageUrl(
      params.handle,
      expandedFilters,
      langCode || getLang(),
      // Sort key/order настраивается per-page в OneEntry admin —
      // опуская `sortKey`/`sortOrder`, мы позволяем серверу применить то,
      // что выбрал редактор (ручная позиция, цена, дата, …), и учесть
      // per-product position-локи, заданные в админке.
      { offset, limit },
    );

    if (typeError(data)) {
      return { isError: true, error: data, total: 0 };
    } else {
      return { isError: false, products: data.items, total: data.total };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e, total: 0 };
  }
};
