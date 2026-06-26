import type { JSX } from 'react';

import HomeSkeleton from '@/components/shared/skeletons/HomeSkeleton';

/**
 * Loading — skeleton shown while the home page loads.
 *
 * Scoped to the `(home)` route group so the boundary wraps only `/` — sibling routes that call
 * `notFound()` (`/[handle]`, `/shop/category/[handle]`, …) stay outside it and keep their hard 404
 * (a root `app/loading.tsx` would wrap them and flush a 200 shell before `notFound()` resolves).
 *
 * @returns JSX of the home page loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <HomeSkeleton />;
}
