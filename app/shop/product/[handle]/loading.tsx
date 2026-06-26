import type { JSX } from 'react';

import ProductSingleSkeleton from '@/components/shared/skeletons/ProductSingleSkeleton';

/**
 * Loading — skeleton shown while a product detail page (`/shop/product/[handle]`) loads.
 *
 * @returns JSX of the product detail loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <ProductSingleSkeleton />;
}
