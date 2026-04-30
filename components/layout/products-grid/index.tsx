import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';
import { type JSX } from 'react';

import { getProducts, getProductsByPageUrl } from '@/app/api';
import CardsGridAnimations from '@/components/layout/products-grid/animations/CardsGridAnimations';

import LoadMore from './components/LoadMore';
import ProductsGrid from './components/ProductsGrid';
import ProductsNotFound from './components/ProductsNotFound';

/**
 * Layout сетки продуктов
 */
const ProductsGridLayout = async ({
  params,
  searchParams: sp,
  dict,
  productsLimit,
  isCategory,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  searchParams?: {
    search?: string;
    page?: string;
    filters?: IFilterParams[];
  };
  dict: IAttributeValues;
  productsLimit: number;
  isCategory?: boolean;
}): Promise<JSX.Element> => {
  const p = await params;
  const searchParams = await sp;
  const currentPage = Number(searchParams?.page) || 1;
  const limit =
    currentPage * productsLimit > 0
      ? currentPage * productsLimit
      : productsLimit;
  const combinedParams = { ...p, searchParams };

  // Получаем все продукты из api или продукты byPageUrl
  const { isError, products, total } = !isCategory
    ? await getProducts({
        offset: 0,
        limit: limit,
        params: combinedParams,
      })
    : await getProductsByPageUrl({
        offset: 0,
        limit: limit,
        params: combinedParams,
      });

  if (!products || total < 1 || isError) {
    return <ProductsNotFound />;
  }

  const totalPages = Math.ceil(total / productsLimit);

  return (
    <CardsGridAnimations
      className={'relative box-border flex w-full shrink-0 flex-col'}
    >
      <section className="products_grid_layout">
        <ProductsGrid
          dict={dict}
          productsLimit={productsLimit}
          products={products}
        />
        {totalPages > 1 && (
          <div className="mt-5 flex w-full justify-center">
            <LoadMore totalPages={totalPages} />
          </div>
        )}
      </section>
    </CardsGridAnimations>
  );
};

export default ProductsGridLayout;
