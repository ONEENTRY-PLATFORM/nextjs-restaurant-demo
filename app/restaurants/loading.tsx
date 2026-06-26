import type { JSX } from 'react';

import RestaurantsIndexSkeleton from '@/components/shared/skeletons/RestaurantsIndexSkeleton';

/**
 * Loading — skeleton shown while the restaurants index (`/restaurants`) loads.
 *
 * @returns JSX of the restaurants index loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <RestaurantsIndexSkeleton />;
}
