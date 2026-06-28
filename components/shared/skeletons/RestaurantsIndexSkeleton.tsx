import type { JSX } from 'react';

import Skeleton from './Skeleton';

/**
 * RestaurantsIndexSkeleton — loading skeleton for the restaurants index (`/restaurants`).
 *
 * Reproduces the heading + description and a responsive grid of restaurant cards (photo over a title / address).
 *
 * @returns JSX of the restaurants index skeleton.
 */
const RestaurantsIndexSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in section_layout pt-0">
      <Skeleton className="h-8 w-64 md:h-9" />
      <Skeleton className="mt-3 h-4 w-full max-w-150 rounded-full" />

      <div className="mt-10 grid grid-cols-1 gap-7.5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3.75">
            <Skeleton className="aspect-16/10 w-full rounded-panel" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestaurantsIndexSkeleton;
