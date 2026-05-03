import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { getApi, getLang } from '@/app/api';
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
      cooking_time_max?: string;
    };
  };
}): Promise<{
  isError: boolean;
  error?: IError;
  products?: IProductsEntity[];
  total: number;
}> => {
  const { limit, offset, langCode, params } = props;
  const lang = langCode || getLang();
  const prefList = (params.searchParams?.preferences ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  // OR-семантика для multi-select preferences (см. комментарий в getProducts.ts):
  // SDK принимает только скалярный `conditionValue`, поэтому для каждого
  // выбранного значения делаем отдельный запрос и мерджим уникальные товары.
  if (prefList.length > 1) {
    const fetchLimit = Math.max(offset + limit, limit) || limit;
    try {
      const results = await Promise.all(
        prefList.map(async (value) => {
          const filters = getSearchParams({
            ...(params.searchParams ?? {}),
            preferences: value,
          });
          const data = await getApi().Products.getProductsByPageUrl(
            params.handle,
            filters,
            lang,
            { offset: 0, limit: fetchLimit },
          );
          if (typeError(data)) return [] as IProductsEntity[];
          return data.items;
        }),
      );
      const seen = new Set<number>();
      const merged: IProductsEntity[] = [];
      for (const items of results) {
        for (const item of items) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          merged.push(item);
        }
      }
      return {
        isError: false,
        products: merged.slice(offset, offset + limit),
        total: merged.length,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      return { isError: true, error: e, total: 0 };
    }
  }

  const expandedFilters = getSearchParams(params.searchParams);

  try {
    const data = await getApi().Products.getProductsByPageUrl(
      params.handle,
      expandedFilters,
      lang,
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
