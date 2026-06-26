import type { JSX } from 'react';

import HomeSkeleton from '@/components/shared/skeletons/HomeSkeleton';

/**
 * Loading — skeleton shown while the home page loads (also the fallback for any route segment without its own `loading.tsx`).
 *
 * @returns JSX of the home page loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <HomeSkeleton />;
}
