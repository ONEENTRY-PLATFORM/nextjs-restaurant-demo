import type { JSX } from 'react';

import { SkeletonBody } from '@/components/layout/products-grid/components/ProductsGridLoader';

import Skeleton from './Skeleton';

/**
 * CategoryRowSkeleton — one home-page category section: a heading bar over a row of product-card skeletons.
 *
 * @param   {object}  props        - Component props.
 * @param   {boolean} [props.tint] - When `true`, wraps the row in the tinted `bg-ink/80` band used by alternating sections.
 * @returns JSX of a single category row skeleton.
 */
const CategoryRowSkeleton = ({ tint = false }: { tint?: boolean }): JSX.Element => {
  const row = (
    <section className="section_layout">
      <Skeleton className="h-6 w-44 md:w-56" />
      <div className="menu_items mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="menu_item relative flex flex-col">
            <SkeletonBody />
          </div>
        ))}
      </div>
    </section>
  );

  return tint ? <div className="w-full bg-ink/80">{row}</div> : row;
};

/**
 * HomeSkeleton — loading skeleton for the home page: promo banner, alternating category rows and a recommended row.
 *
 * @returns JSX of the home page skeleton.
 */
const HomeSkeleton = (): JSX.Element => {
  return (
    <div aria-hidden="true" className="flex w-full flex-col">
      {/* Promo banner */}
      <div className="section_layout pt-0">
        <Skeleton className="hidden h-60 w-full rounded-panel md:block lg:h-75" />
        <div className="flex gap-2.5 overflow-hidden md:hidden">
          <Skeleton className="h-40 w-4/5 shrink-0 rounded-panel" />
          <Skeleton className="h-40 w-1/3 shrink-0 rounded-panel" />
        </div>
      </div>

      {/* Recommended row */}
      <CategoryRowSkeleton />

      {/* Alternating category rows */}
      <CategoryRowSkeleton tint />
      <CategoryRowSkeleton />
    </div>
  );
};

export default HomeSkeleton;
