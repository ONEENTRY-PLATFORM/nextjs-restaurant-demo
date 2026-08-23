import { unstable_cache } from 'next/cache';
import type { IError, IProductsEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api';
import getSearchParams from '@/app/api/utils/getSearchParams';

type SearchParams = {
  search?: string;
  preferences?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  cooking_time_max?: string;
};

type ProductsResult = {
  isError: boolean;
  error?: IError;
  products?: IProductsEntity[];
  total: number;
};

const splitCsv = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

// Stable cache-key signature: object property order must not influence the key.
const buildKey = (
  limit: number,
  offset: number,
  lang: string,
  searchParams?: SearchParams
): string =>
  JSON.stringify([
    limit,
    offset,
    lang,
    {
      search: searchParams?.search ?? '',
      preferences: searchParams?.preferences ?? '',
      filter: searchParams?.filter ?? '',
      minPrice: searchParams?.minPrice ?? '',
      maxPrice: searchParams?.maxPrice ?? '',
      cooking_time_max: searchParams?.cooking_time_max ?? '',
    },
  ]);

const fetchProductsImpl = unstable_cache(
  async (
    _signature: string,
    limit: number,
    offset: number,
    lang: string,
    searchParams: SearchParams
  ): Promise<ProductsResult> => {
    const prefList = splitCsv(searchParams.preferences);
    const filterList = splitCsv(searchParams.filter);

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
              ...searchParams,
              [expansion.key]: value,
            });
            const data = await getApi().Products.getProducts(filters, lang, {
              offset: 0,
              limit: fetchLimit,
            });
            if (isError(data)) return [] as IProductsEntity[];
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

    const expandedFilters = getSearchParams(searchParams);

    try {
      const data = await getApi().Products.getProducts(expandedFilters, lang, { offset, limit });
      if (isError(data)) {
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
  },
  ['oneentry-getProducts'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-products'] }
);

/**
 * getProducts — paginated products with filter.
 *
 * @param   {object} props            - Pagination, locale, and inbound `searchParams` filters.
 * @param   {number} props.limit      - Page size.
 * @param   {number} props.offset     - Page offset.
 * @param   {string} [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @param   {object} [props.params]   - Optional inbound `searchParams` map.
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
  }): Promise<ProductsResult> => {
    const { limit, offset, langCode, params } = props;
    const lang = langCode || getLang();
    const searchParams = params?.searchParams ?? {};
    const signature = buildKey(limit, offset, lang, searchParams);
    return fetchProductsImpl(signature, limit, offset, lang, searchParams);
  }
);
