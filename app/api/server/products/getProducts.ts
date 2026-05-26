import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';
import { typeError } from '@/components/utils';

type SearchParams = {
  search?: string;
  preferences?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  cooking_time_max?: string;
};

const splitCsv = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

/**
 * getProducts — paginated products with filter.
 *
 * For multi-select list attributes (`preferences`, `filter`), fetches each unique value in a separate
 * request and merges unique items (OR semantics).
 *
 * @param   {object} props            - Pagination, locale, and inbound `searchParams` filters.
 * @param   {number} props.limit      - Page size.
 * @param   {number} props.offset     - Page offset.
 * @param   {string} [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @param   {object} [props.params]   - Optional category handle and inbound `searchParams` map.
 * @returns Promise resolving to `{ isError, error?, products?, total }` (graceful fallback on SDK error).
 */
export const getProducts = cache(
  async (props: {
    limit: number;
    offset: number;
    langCode?: string;
    params?: {
      searchParams?: SearchParams;
    };
  }): Promise<{
    isError: boolean;
    error?: IError;
    products?: IProductsEntity[];
    total: number;
  }> => {
    const { limit, offset, langCode, params } = props;
    const lang = langCode || getLang();
    const prefList = splitCsv(params?.searchParams?.preferences);
    const filterList = splitCsv(params?.searchParams?.filter);

    // OR semantics for multi-select list attributes: the SDK accepts only a scalar in
    // `conditionValue`, so each value is fetched in a separate request and unique items are merged.
    // We expand on whichever list is multi-valued and pin the other side to its original CSV.
    const multiPref = prefList.length > 1;
    const multiFilter = filterList.length > 1;
    if (multiPref || multiFilter) {
      const expansion: { key: 'preferences' | 'filter'; values: string[] } = multiPref
        ? { key: 'preferences', values: prefList }
        : { key: 'filter', values: filterList };
      const fetchLimit = Math.max(offset + limit, limit) || limit;
      try {
        const results = await Promise.all(
          expansion.values.map(async value => {
            const filters = getSearchParams({
              ...(params?.searchParams ?? {}),
              [expansion.key]: value,
            });
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

    const expandedFilters = getSearchParams(params?.searchParams);

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
