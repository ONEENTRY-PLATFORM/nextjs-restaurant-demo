import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';

import { PRODUCT_ATTRS } from '@/app/utils/constants';

/**
 * getSearchParams — builds an `IFilterParams` array for a Products API request from URL `searchParams`.
 *
 * @param   {object}  [searchParams] - Inbound URL `searchParams` map (search, preferences, filter, price range, cooking_time_max).
 * @returns Array of OneEntry `IFilterParams` suitable for `Products.getProducts*`.
 */
const getSearchParams = (searchParams?: {
  search?: string;
  preferences?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  cooking_time_max?: string;
}) => {
  const expandedFilters: IFilterParams[] = [];

  // Filter out service products that have no SKU.
  expandedFilters.push({
    attributeMarker: PRODUCT_ATTRS.sku,
    conditionMarker: 'nin',
    conditionValue: null,
    title: searchParams?.search || '',
    isNested: false,
  });

  if (searchParams?.preferences) {
    // Multi-select preferences arrive as `?preferences=Meat,Fish`.
    // `IFilterParams.conditionValue` accepts only a scalar, so each value
    // becomes its own filter (AND semantics on the OneEntry side).
    const values = searchParams.preferences
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    for (const value of values) {
      expandedFilters.push({
        attributeMarker: PRODUCT_ATTRS.preferences,
        conditionMarker: 'in',
        conditionValue: value,
        title: searchParams.search || '',
        isNested: false,
      });
    }
  }

  if (searchParams?.filter) {
    // `?filter=Dinner,Soup` — same shape and semantics as `?preferences=...`. OR semantics across
    // values is handled in `getProducts` / `getProductsByPageUrl` (one request per value, merged).
    const values = searchParams.filter
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    for (const value of values) {
      expandedFilters.push({
        attributeMarker: PRODUCT_ATTRS.filter,
        conditionMarker: 'in',
        conditionValue: value,
        title: searchParams.search || '',
        isNested: false,
      });
    }
  }

  if (searchParams?.minPrice) {
    const min = Number(searchParams.minPrice);
    if (Number.isFinite(min)) {
      expandedFilters.push({
        attributeMarker: PRODUCT_ATTRS.price,
        conditionMarker: 'mth',
        conditionValue: min,
        title: searchParams.search || '',
        isNested: false,
      });
    }
  }

  if (searchParams?.maxPrice) {
    const max = Number(searchParams.maxPrice);
    if (Number.isFinite(max)) {
      expandedFilters.push({
        attributeMarker: PRODUCT_ATTRS.price,
        conditionMarker: 'lth',
        conditionValue: max,
        title: searchParams.search || '',
        isNested: false,
      });
    }
  }

  if (searchParams?.cooking_time_max) {
    const max = Number(searchParams.cooking_time_max);
    if (Number.isFinite(max)) {
      expandedFilters.push({
        attributeMarker: PRODUCT_ATTRS.cookingTime,
        conditionMarker: 'lth',
        conditionValue: max,
        title: searchParams.search || '',
        isNested: false,
      });
    }
  }

  return expandedFilters;
};

export default getSearchParams;
