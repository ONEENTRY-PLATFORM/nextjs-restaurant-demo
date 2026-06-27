import { unstable_cache } from 'next/cache';
import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
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

// `unstable_cache` keys are derived from positional args, so the entry point
// flattens the nested `params` object into a stable signature string. That
// keeps `unstable_cache(args)` cheap to serialize and avoids accidental cache
// fragmentation when the caller passes equivalent objects with different
// property order.
const buildKey = (
  limit: number,
  offset: number,
  lang: string,
  handle: string,
  searchParams?: SearchParams
): string =>
  JSON.stringify([
    limit,
    offset,
    lang,
    handle,
    {
      search: searchParams?.search ?? '',
      preferences: searchParams?.preferences ?? '',
      filter: searchParams?.filter ?? '',
      minPrice: searchParams?.minPrice ?? '',
      maxPrice: searchParams?.maxPrice ?? '',
      cooking_time_max: searchParams?.cooking_time_max ?? '',
    },
  ]);

const fetchProducts = unstable_cache(
  async (
    _signature: string,
    limit: number,
    offset: number,
    lang: string,
    handle: string,
    searchParams: SearchParams
  ): Promise<ProductsResult> => {
    const prefList = splitCsv(searchParams.preferences);
    const filterList = splitCsv(searchParams.filter);

    // OR semantics for multi-select list attributes (see getProducts.ts): the SDK accepts only a
    // scalar in `conditionValue` — fetch each value in a separate request and merge.
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
            const filters = getSearchParams({ ...searchParams, [expansion.key]: value });
            const data = await getApi().Products.getProductsByPageUrl(handle, filters, lang, {
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
      } catch (e: unknown) {
        return { isError: true, error: e as IError, total: 0 };
      }
    }

    const expandedFilters = getSearchParams(searchParams);

    try {
      const data = await getApi().Products.getProductsByPageUrl(handle, expandedFilters, lang, {
        offset,
        limit,
      });
      if (isError(data)) {
        return { isError: true, error: data, total: 0 };
      }
      return { isError: false, products: data.items, total: data.total };
    } catch (e: unknown) {
      return { isError: true, error: e as IError, total: 0 };
    }
  },
  ['oneentry-getProductsByPageUrl'],
  // Catalogue churn is slower than blocks/pages, but search-result staleness
  // is more user-visible — 60 s matches the page-level revalidate.
  { revalidate: 60, tags: ['oneentry', 'oneentry-products'] }
);

/**
 * getProductsByPageUrl — paginated products of the selected category.
 *
 * Composed cache (see {@link import('../pages/getPageByUrl').getPageByUrl}):
 * `unstable_cache` for 60 s cross-request caching, React `cache()` for
 * in-render deduplication. The cache key includes locale, handle, pagination
 * and every search-param filter so different listings stay independent.
 *
 * For multi-select `preferences`, runs one request per value, merges unique
 * items (OR semantics), then slices to the requested page.
 *
 * @param   {object} props          - Pagination, locale, category handle, and search-param filters.
 * @param   {number} props.limit    - Page size.
 * @param   {number} props.offset   - Page offset.
 * @param   {string} [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @param   {object} props.params   - Category handle and inbound `searchParams` map.
 * @returns Promise resolving to `{ isError, error?, products?, total }` (graceful fallback on SDK error).
 */
export const getProductsByPageUrl = cache(
  async (props: {
    limit: number;
    offset: number;
    langCode?: string;
    params: {
      handle: string;
      searchParams?: SearchParams;
    };
  }): Promise<ProductsResult> => {
    const { limit, offset, langCode, params } = props;
    const lang = langCode || getLang();
    const searchParams = params.searchParams ?? {};
    const signature = buildKey(limit, offset, lang, params.handle, searchParams);
    return fetchProducts(signature, limit, offset, lang, params.handle, searchParams);
  }
);
