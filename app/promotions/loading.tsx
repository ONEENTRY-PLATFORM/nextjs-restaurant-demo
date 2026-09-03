import type { JSX } from 'react';

import Skeleton from '@/components/shared/skeletons/Skeleton';

/**
 * Loading — skeleton shown while the promotions index (`/promotions`) loads.
 *
 * Reproduces breadcrumbs, heading + subtitle and the vertical stack of promo banners.
 *
 * @returns JSX of the promotions loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <section aria-hidden="true" className="skeleton-fade-in section_layout">
      {/* Breadcrumbs */}
      <div className="mb-5 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-3 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>

      {/* Title + subtitle */}
      <Skeleton className="h-6 w-1/2 max-w-100" />
      <Skeleton className="mt-3.75 h-4 w-3/4 max-w-150 rounded-full" />

      {/* Banners */}
      <div className="mt-12.5 flex flex-col gap-15">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/1 w-full rounded-panel md:aspect-1292/192" />
        ))}
      </div>
    </section>
  );
}
