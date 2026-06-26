import type { JSX } from 'react';

import Skeleton from '@/components/shared/skeletons/Skeleton';

/**
 * Loading — skeleton shown while the service landing (`/service`) loads.
 *
 * Reproduces the centred logo and the two stacked CTA buttons over the full-screen background.
 *
 * @returns JSX of the service loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <div aria-hidden="true" className="min-h-screen bg-black bg-cover bg-no-repeat">
      <div className="mx-auto max-w-98.25 px-5">
        <Skeleton className="mx-auto mt-41.25 h-52.5 w-62.5 rounded-card" />
        <Skeleton className="mt-42.5 h-15 w-full rounded-card" />
        <Skeleton className="mt-5 h-15 w-full rounded-card" />
      </div>
    </div>
  );
}
