import type { JSX } from 'react';

import Skeleton from './Skeleton';

/**
 * ProductSingleSkeleton — loading skeleton for the product detail page (`/shop/product/[handle]`).
 *
 * Reproduces the two-column layout: an image block on the left and the title / price / description / add-to-cart column on the right, followed by a related-items row.
 *
 * @returns JSX of the product detail skeleton.
 */
const ProductSingleSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in shop_section">
      {/* Breadcrumb + title (desktop only) */}
      <div className="hidden flex-col gap-2.5 md:flex">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-6 w-2/3 max-w-100" />
      </div>

      {/* Two-column block: gallery left, details right */}
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-15">
        {/* Gallery */}
        <div className="relative -mx-4 w-[calc(100%+2rem)] md:mx-auto md:w-full md:max-w-175 lg:mx-0 lg:min-w-153.75 lg:shrink-0">
          <Skeleton className="aspect-square w-full rounded-card md:rounded-panel" />
        </div>

        {/* Details */}
        <div className="flex w-full flex-col gap-5 lg:min-w-0 lg:flex-1">
          {/* Mobile title + price */}
          <div className="flex items-start justify-between gap-3.75 md:hidden">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-6 w-44" />
            </div>
            <Skeleton className="h-13 w-18 shrink-0 rounded-panel" />
          </div>

          {/* Description lines */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3.5 w-full rounded-full" />
            <Skeleton className="h-3.5 w-11/12 rounded-full" />
            <Skeleton className="h-3.5 w-4/5 rounded-full" />
            <Skeleton className="h-3.5 w-3/4 rounded-full" />
          </div>

          {/* Quantity + add-to-cart */}
          <div className="mt-2 flex items-center gap-4">
            <Skeleton className="h-12 w-28 rounded-card" />
            <Skeleton className="h-12 grow rounded-card" />
          </div>
        </div>
      </div>

      {/* Related items row */}
      <div className="mt-15 flex flex-col gap-5">
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-card" />
              <Skeleton className="h-3.5 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSingleSkeleton;
