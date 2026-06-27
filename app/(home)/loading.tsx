import type { JSX } from 'react';

import HomeSkeleton from '@/components/shared/skeletons/HomeSkeleton';

/**
 * Loading — skeleton shown while the home page loads.
 *
 * @returns JSX of the home page loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <HomeSkeleton />;
}
