import type { JSX } from 'react';

import ProductSingleSkeleton from '@/components/shared/skeletons/ProductSingleSkeleton';

/**
 * Loading — skeleton shown while a product detail page (`/shop/product/[handle]`) loads.
 *
 * Without this file the route inherits the parent `app/shop/loading.tsx` (catalog grid skeleton),
 * which is the wrong shape for a single product. A closer boundary here overrides it.
 *
 * @returns JSX of the product detail loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <ProductSingleSkeleton />;
}
