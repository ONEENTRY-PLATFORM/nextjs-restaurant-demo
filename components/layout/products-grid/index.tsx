import { type JSX } from 'react';

import { getProducts, getProductsByPageUrl } from '@/app/api';
import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';
import CardsGridAnimations from '@/components/layout/products-grid/animations/CardsGridAnimations';

import LoadMore from './components/LoadMore';
import ProductsGrid from './components/ProductsGrid';
import ProductsGridLoader from './components/ProductsGridLoader';
import ProductsGridReveal from './components/ProductsGridReveal';
import ProductsNotFound from './components/ProductsNotFound';

type GridSearchParams = {
  search?: string;
  page?: string;
  preferences?: string;
  filter?: string;
  minPrice?: string;
  maxPrice?: string;
  cooking_time_max?: string;
};

/**
 * ProductsGridLayout — paginated product grid (root catalog or category) with infinite-scroll LoadMore.
 *
 * @param   {object}              props                - Component props.
 * @param   {Promise<object> | object} props.params    - Route params (`handle`, `locale`) — sync or async.
 * @param   {GridSearchParams}    [props.searchParams] - Inbound URL `searchParams` map (search/page/filters).
 * @param   {number}              props.productsLimit  - Page size used to compute `offset`/`limit` and total page count.
 * @param   {boolean}             [props.isCategory]   - When `true`, fetches via `getProductsByPageUrl(handle)` instead of the global catalog.
 * @returns JSX of the products grid (with reveal animation), or `<ProductsNotFound />` when empty.
 */
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

  const { isError, products, total } = !isCategory
    ? await getProducts({
        offset: 0,
        limit: limit,
        params: searchParams ? { searchParams } : {},
      })
    : await getProductsByPageUrl({
        offset: 0,
        limit: limit,
        params: { handle: p.handle as string, ...(searchParams ? { searchParams } : {}) },
      });

  if (!products || total < 1 || isError) {
    return <ProductsNotFound />;
  }

  const totalPages = Math.ceil(total / productsLimit);
  const blurMap = await getProductBlurMap(products);

  return (
    <ProductsGridReveal skeleton={<ProductsGridLoader productsLimit={productsLimit} scaleOnly />}>
      <CardsGridAnimations className={'relative box-border flex w-full shrink-0 flex-col'}>
        <section className="products_grid_layout">
          <ProductsGrid productsLimit={productsLimit} products={products} blurMap={blurMap} />
          {totalPages > 1 && (
            <div className="mt-5 flex w-full justify-center">
              <LoadMore totalPages={totalPages} />
            </div>
          )}
        </section>
      </CardsGridAnimations>
    </ProductsGridReveal>
  );
};

export default ProductsGridLayout;
