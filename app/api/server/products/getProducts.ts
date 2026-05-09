import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';
import { typeError } from '@/components/utils';

/** getProducts — paginated products with filter. */
export const getProducts = cache(
  async (props: {
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
    const prefList = (params?.searchParams?.preferences ?? '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    // OR semantics for multi-select preferences: the SDK accepts only a scalar in `conditionValue`,
    // so each value is fetched in a separate request and unique items are merged. The AND variant is
    // almost always empty — the admin has no dishes that satisfy all selected preferences at once.
    if (prefList.length > 1) {
      const fetchLimit = Math.max(offset + limit, limit) || limit;
      try {
        const results = await Promise.all(
          prefList.map(async value => {
            const filters = getSearchParams(
              { ...(params?.searchParams ?? {}), preferences: value },
              params?.handle
            );
            const data = await getApi().Products.getProducts(filters, lang, {
              offset: 0,
              limit: fetchLimit,
            });
            if (typeError(data)) return [] as IProductsEntity[];
            return data.items;
          })
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
      } catch (error) {
        return { isError: true, error: error as IError, total: 0 };
      }
    }

    const expandedFilters = getSearchParams(params?.searchParams, params?.handle);

    try {
      const data = await getApi().Products.getProducts(
        expandedFilters,
        lang,
        // Omit sortKey/sortOrder — the server applies the sort chosen in the admin and the position locks.
        { offset, limit }
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
  }
);
