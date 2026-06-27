import type { JSX } from 'react';

import ShopCatalogSkeleton from '@/components/shared/skeletons/ShopCatalogSkeleton';

/**
 * Loading — skeleton shown while a shop category (`/shop/category/[handle]`) loads.
 *
 * @returns JSX of the catalog loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <ShopCatalogSkeleton />;
}
