import type { JSX } from 'react';

import Skeleton from './Skeleton';

/**
 * RestaurantDetailSkeleton — loading skeleton for a restaurant detail page (`/restaurants/[handle]`).
 *
 * Reproduces the section order: back link, title, photo gallery, description, info grid, comforts row and the contacts + map block.
 *
 * @returns JSX of the restaurant detail skeleton.
 */
const RestaurantDetailSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in section_layout pt-0">
      {/* Back link */}
      <Skeleton className="mb-5 h-4 w-36 rounded-full" />

      {/* Title */}
      <Skeleton className="mx-auto h-6 w-2/3 max-w-100 md:mx-0" />

      {/* Photo gallery */}
      <Skeleton className="mt-7.5 aspect-video w-full rounded-panel" />

      {/* Description */}
      <div className="mt-10 flex flex-col gap-3">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-11/12 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
      </div>

      {/* Info grid */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Comforts row + CTA */}
      <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-15">
        <div className="flex flex-wrap items-center justify-between gap-5 md:justify-start md:gap-7.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-25 shrink-0 rounded-full" />
          ))}
        </div>
        <Skeleton className="hidden h-12 w-full max-w-114.5 rounded-card md:block" />
      </div>

      {/* Contacts + map */}
      <div className="mt-12 grid grid-cols-1 gap-7.5 md:grid-cols-[338fr_953fr] md:gap-10">
        <div className="flex flex-col gap-3.75">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-45 w-full rounded-card md:h-78" />
      </div>
    </section>
  );
};

export default RestaurantDetailSkeleton;
