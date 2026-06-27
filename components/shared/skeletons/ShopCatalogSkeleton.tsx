import type { JSX } from 'react';

import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

/**
 * ShopCatalogSkeleton — route-level skeleton shared by every catalog route
 * (`/shop`, `/shop/[handle]`, `/shop/category/[handle]`).
 *
 * Mirrors each page's `shop_section` wrapper and reuses the same `ProductsGridLoader` those pages
 * render inside their inner `<Suspense>`, so the route skeleton hands off to the streamed grid
 * without a visual flash.
 *
 * @returns JSX of the catalog loading skeleton.
 */
export default function ShopCatalogSkeleton(): JSX.Element {
  return (
    <section className="shop_section">
      <div className="flex w-full flex-col items-center gap-5">
        <ProductsGridLoader productsLimit={SHOP_PAGE_LIMIT} />
      </div>
    </section>
  );
}
