import type { JSX } from 'react';

import Skeleton from './Skeleton';

/**
 * ProfileSkeleton — loading skeleton for the `/profile/**` content slot (personal data, orders, favorites, bookings).
 *
 * Renders only the page content — the breadcrumbs + title come from the persistent `ProfilePageHeader` in the profile layout. Reproduces the two-column layout: content column on the left, promo sidebar on the right (desktop only).
 *
 * @returns JSX of the profile content skeleton.
 */
const ProfileSkeleton = (): JSX.Element => {
  return (
    <div aria-hidden="true" className="skeleton-fade-in md:flex md:justify-between md:gap-15">
      {/* Content column */}
      <div className="flex w-full flex-col gap-5 md:w-1/2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-card" />
        ))}
        <Skeleton className="mt-2 h-12 w-40 rounded-card" />
      </div>

      {/* Promo sidebar (desktop) */}
      <div className="mt-10 hidden w-full max-w-90 shrink-0 flex-col gap-5 md:mt-0 md:flex">
        <Skeleton className="h-60 w-full rounded-panel" />
        <Skeleton className="h-60 w-full rounded-panel" />
      </div>
    </div>
  );
};

export default ProfileSkeleton;
