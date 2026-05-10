import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';

/**
 * getSearchParams — builds an `IFilterParams` array for a Products API request from URL `searchParams`.
 *
 * @param   {object}  [searchParams] - Inbound URL `searchParams` map (search, in_stock, color, preferences, price range, cooking_time_max).
 * @param   {string}  [handle]       - Optional category handle that becomes a `stickers` filter.
 * @returns {Array<IFilterParams & { statusMarker?: string }>}                  Array of OneEntry `IFilterParams` (with optional `statusMarker`) suitable for `Products.getProducts*`.
 */
const getSearchParams = (
  searchParams?: {
    search?: string;
    in_stock?: string;
    color?: string;
    preferences?: string;
    minPrice?: string;
    maxPrice?: string;
    cooking_time_max?: string;
  },
  handle?: string
) => {
  const expandedFilters: Array<IFilterParams & { statusMarker?: string }> | undefined = [];

  // Filter out service products that have no SKU.
  const servicesFilter: IFilterParams = {
    attributeMarker: 'sku',
    conditionMarker: 'nin',
    conditionValue: null,
    title: searchParams?.search || '',
    isNested: false,
  };
  expandedFilters.push(servicesFilter);

  if (handle) {
    const stickersFilter: IFilterParams = {
      attributeMarker: 'stickers',
      conditionMarker: 'in',
      conditionValue: handle,
      title: searchParams?.search || '',
      isNested: false,
    };
    expandedFilters.push(stickersFilter);
  }

  if (searchParams?.in_stock) {
    expandedFilters.push({
      statusMarker: 'in_stock',
      attributeMarker: 'price',
      conditionValue: null,
      title: searchParams.search || '',
      isNested: false,
    });
  }

  if (searchParams?.color) {
    const newFilter: IFilterParams = {
      attributeMarker: 'color',
      conditionMarker: 'in',
      conditionValue: searchParams.color,
      title: searchParams.search || '',
      isNested: false,
    };
    expandedFilters.push(newFilter);
  }

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
        attributeMarker: 'preferences',
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
        attributeMarker: 'price',
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
        attributeMarker: 'price',
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
        attributeMarker: 'cooking_time',
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
