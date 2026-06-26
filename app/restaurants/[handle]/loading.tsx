import type { JSX } from 'react';

import RestaurantDetailSkeleton from '@/components/shared/skeletons/RestaurantDetailSkeleton';

/**
 * Loading — skeleton shown while a restaurant detail page (`/restaurants/[handle]`) loads.
 *
 * @returns JSX of the restaurant detail loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <RestaurantDetailSkeleton />;
}
