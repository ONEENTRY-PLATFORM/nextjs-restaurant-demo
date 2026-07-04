import type { JSX } from 'react';

import { SkeletonBody } from '@/components/layout/products-grid/components/ProductsGridLoader';

import Skeleton from './Skeleton';

/**
 * ProductSingleSkeleton — loading skeleton for the product detail page (`/shop/product/[handle]`).
 *
 * Mirrors `ProductSingle`: breadcrumb + title (md+), the cover image (full-bleed `max-h-75` on
 * mobile, square at md, fixed `h-115` at lg), the details column (mobile title + price badge,
 * metrics row with a price badge on md+, ingredients line, preference pills, full-width
 * add-to-cart CTA, reviews header) and a related-items `menu_items` grid of product cards.
 *
 * @returns JSX of the product detail loading skeleton.
 */
const ProductSingleSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in shop_section">
      {/* Breadcrumb + title (desktop only) */}
      <div className="hidden flex-col gap-2.5 md:flex">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-6 w-2/3 max-w-100" />
      </div>

      {/* Two-column block: cover left, details right */}
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-15">
        {/* Cover — same height profile as the ProductCover image */}
        <div className="relative -mx-4 w-[calc(100%+2rem)] md:mx-auto md:w-full md:max-w-175 lg:mx-0 lg:min-w-153.75 lg:shrink-0">
          <Skeleton className="h-75 w-full rounded-none md:aspect-square md:h-auto lg:aspect-auto lg:h-115" />
        </div>

        {/* Details */}
        <div className="flex w-full flex-col lg:min-w-0 lg:flex-1">
          {/* Mobile: category + title left, price badge right */}
          <div className="flex items-start justify-between gap-3.75 md:hidden">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-6 w-44" />
            </div>
            <Skeleton className="h-13 w-18 shrink-0 rounded-panel" />
          </div>

          <div className="flex flex-col gap-3.75">
            {/* Metrics row (weight / calories / rating) + price badge on md+ */}
            <div className="flex items-start justify-between gap-3.75 lg:flex-row-reverse">
              <div className="mt-2.5 flex items-center gap-1.25 md:gap-3.75">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="hidden h-13 w-18 shrink-0 rounded-panel md:block" />
            </div>

            {/* Ingredients line */}
            <Skeleton className="h-3.5 w-11/12 rounded-full" />

            {/* Preference pills */}
            <div className="flex flex-wrap gap-3.75">
              <Skeleton className="h-8.5 w-24" />
              <Skeleton className="h-8.5 w-28" />
            </div>

            {/* Add-to-cart CTA — full-width gradient button */}
            <Skeleton className="mt-2.5 min-h-16.5 w-full rounded-panel" />
          </div>

          {/* Reviews header + empty-state line */}
          <div className="mt-5 flex flex-col gap-2.5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-3.5 w-3/4 rounded-full" />
          </div>
        </div>
      </div>

      {/* Related items row — same grid/card shape as ProductsGridLoader */}
      <div className="flex flex-col pt-15">
        <Skeleton className="mb-3 h-6 w-56" />
        <div className="menu_items">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="menu_item relative flex flex-col">
              <SkeletonBody />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSingleSkeleton;
