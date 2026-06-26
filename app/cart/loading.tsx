import type { JSX } from 'react';

import CartSkeleton from '@/components/shared/skeletons/CartSkeleton';

/**
 * Loading — skeleton shown while the cart / checkout page (`/cart`) loads.
 *
 * @returns JSX of the cart loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <CartSkeleton />;
}
