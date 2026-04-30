import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';

/**
 * Получает параметры поиска для фильтра.
 */
const getSearchParams = (
  searchParams?: {
    search?: string;
    in_stock?: string;
    color?: string;
    preferences?: string;
    minPrice?: string;
    maxPrice?: string;
  },
  handle?: string,
) => {
  const expandedFilters:
    | Array<IFilterParams & { statusMarker?: string }>
    | undefined = [];

  // проверяем, есть ли у продукта SKU или это сервисный продукт
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
    const preferencesFilter: IFilterParams = {
      attributeMarker: 'preferences',
      conditionMarker: 'in',
      conditionValue: searchParams.preferences,
      title: searchParams.search || '',
      isNested: false,
    };
    expandedFilters.push(preferencesFilter);
  }

  return expandedFilters;
};

export default getSearchParams;
