import type { JSX } from 'react';

import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';
import Skeleton from '@/components/shared/skeletons/Skeleton';

/**
 * Loading — skeleton shown while a promo detail page (`/promotions/[handle]`) loads.
 *
 * Reproduces breadcrumbs, the banner image, heading + subtitle and reuses the product-card grid skeleton for the promo products.
 *
 * @returns JSX of the promo loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <section aria-hidden="true" className="skeleton-fade-in section_layout">
      {/* Breadcrumbs */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-3 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-3 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Banner image */}
      <Skeleton className="aspect-2/1 w-full rounded-panel md:aspect-1292/192" />

      {/* Title + subtitle */}
      <div className="mt-11.25 flex flex-col gap-3.75">
        <Skeleton className="h-6 w-1/2 max-w-100" />
        <Skeleton className="h-4 w-3/4 max-w-150 rounded-full" />
      </div>

      {/* Products grid */}
      <div className="mt-12.5">
        <ProductsGridLoader />
      </div>
    </section>
  );
}
