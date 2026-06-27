import type { JSX } from 'react';

import ShopCatalogSkeleton from '@/components/shared/skeletons/ShopCatalogSkeleton';

/**
 * Loading — skeleton shown while the shop catalog (`/shop`) loads.
 *
 * @returns JSX of the shop catalog loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <ShopCatalogSkeleton />;
}
