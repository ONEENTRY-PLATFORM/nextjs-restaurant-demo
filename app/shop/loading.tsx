import type { JSX } from 'react';

import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

/**
 * Loading — skeleton shown while any catalog grid route loads (`/shop`, `/shop/[handle]`, `/shop/category/[handle]`).
 *
 * Mirrors the page wrapper (`shop_section` + centred column) and reuses the product-card grid skeleton so the grid lands in place without a layout shift.
 *
 * @returns JSX of the catalog loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <section className="shop_section">
      <div className="flex w-full flex-col items-center gap-5">
        <ProductsGridLoader productsLimit={SHOP_PAGE_LIMIT} />
      </div>
    </section>
  );
}
