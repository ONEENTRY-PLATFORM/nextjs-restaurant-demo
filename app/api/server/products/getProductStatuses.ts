import { unstable_cache } from 'next/cache';
import type { IProductStatusEntity } from 'oneentry/dist/product-statuses/productStatusesInterfaces';
import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import { PRODUCT_STATUSES } from '@/app/utils/constants';
import { typeError } from '@/components/utils';

const fetchProductStatuses = unstable_cache(
  async (lang: string): Promise<IProductStatusEntity[]> => {
    try {
      const data = await getApi().ProductStatuses.getProductStatuses(lang);
      if (typeError(data)) {
        return [];
      }
      return data as IProductStatusEntity[];
    } catch {
      return [];
    }
  },
  ['oneentry-getProductStatuses'],
  // Statuses are project-level config that changes about as rarely as attribute sets — match their 300 s window.
  { revalidate: 300, tags: ['oneentry', 'oneentry-product-statuses'] }
);

/**
 * getProductStatuses — all product-status objects (`in_stock`, `out_of_stock`, …) from OneEntry.
 *
 * @param   {string} [langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to the array of product-status entities (`[]` on error).
 */
export const getProductStatuses = cache(
  async (langCode?: string): Promise<IProductStatusEntity[]> =>
    fetchProductStatuses(langCode || getLang())
);

/**
 * resolveOutOfStockMarker — picks the status identifier that marks a product as not purchasable.
 *
 * @param   {IProductStatusEntity[]} statuses - Statuses returned by {@link getProductStatuses}.
 * @returns The out-of-stock status identifier (marker) to compare `product.statusIdentifier` against.
 */
export const resolveOutOfStockMarker = (statuses: IProductStatusEntity[]): string => {
  const canonical = statuses.find(s => s.identifier === PRODUCT_STATUSES.outOfStock);
  if (canonical) {
    return canonical.identifier;
  }
  const [onlyNonDefault, ...rest] = statuses.filter(s => !s.isDefault);
  if (onlyNonDefault && rest.length === 0) {
    return onlyNonDefault.identifier;
  }
  return PRODUCT_STATUSES.outOfStock;
};

/**
 * getOutOfStockMarker — the live out-of-stock status marker, resolved from {@link getProductStatuses}.
 *
 * @param   {string} [langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to the out-of-stock status identifier.
 */
export const getOutOfStockMarker = cache(
  async (langCode?: string): Promise<string> =>
    resolveOutOfStockMarker(await getProductStatuses(langCode))
);
