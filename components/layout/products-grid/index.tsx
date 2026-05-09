import { type JSX } from 'react';

import { getProducts, getProductsByPageUrl } from '@/app/api';
import CardsGridAnimations from '@/components/layout/products-grid/animations/CardsGridAnimations';

import LoadMore from './components/LoadMore';
import ProductsGrid from './components/ProductsGrid';
import ProductsNotFound from './components/ProductsNotFound';

type GridSearchParams = {
  search?: string;
  page?: string;
  in_stock?: string;
  color?: string;
  preferences?: string;
  minPrice?: string;
  maxPrice?: string;
  cooking_time_max?: string;
};

/** ProductsGridLayout — сетка продуктов с пагинацией. */
const ProductsGridLayout = async ({
  params,
  searchParams: sp,
  productsLimit,
  isCategory,
}: {
  params: Promise<{ handle?: string; locale?: string }> | { handle?: string; locale?: string };
  searchParams?: GridSearchParams;
  productsLimit: number;
  isCategory?: boolean;
}): Promise<JSX.Element> => {
  const p = await params;
  const searchParams = await sp;

  if (isCategory && !p.handle) {
    return <ProductsNotFound />;
  }

  const currentPage = Number(searchParams?.page) || 1;
  const limit = currentPage * productsLimit > 0 ? currentPage * productsLimit : productsLimit;
  const combinedParams = searchParams ? { ...p, searchParams } : { ...p };

  const { isError, products, total } = !isCategory
    ? await getProducts({
        offset: 0,
        limit: limit,
        params: combinedParams,
      })
    : await getProductsByPageUrl({
        offset: 0,
        limit: limit,
        params: { ...combinedParams, handle: p.handle as string },
      });

  if (!products || total < 1 || isError) {
    return <ProductsNotFound />;
  }

  const totalPages = Math.ceil(total / productsLimit);

  return (
    <CardsGridAnimations className={'relative box-border flex w-full shrink-0 flex-col'}>
      <section className="products_grid_layout">
        <ProductsGrid productsLimit={productsLimit} products={products} />
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
