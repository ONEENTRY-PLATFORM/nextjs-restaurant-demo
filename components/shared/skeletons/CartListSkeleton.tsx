import type { JSX } from 'react';

import { CartLineSkeleton } from './CartSkeleton';
import Skeleton from './Skeleton';

/**
 * CartListSkeleton — loading skeleton for the cart step's product list (client-side RTK fetch).
 *
 * Mirrors `CartPage`: a column of cart-line skeletons followed by the APPLY button placeholder. Reuses `CartLineSkeleton` so the client-fetch phase matches the navigation skeleton (`loading.tsx`) and the swap to real cards is seamless.
 *
 * @param   {object}   props         - Component props.
 * @param   {number}   [props.count] - Number of cart-line skeletons to render (defaults to 3).
 * @returns JSX of the cart product-list skeleton.
 */
const CartListSkeleton = ({ count = 3 }: { count?: number }): JSX.Element => {
  return (
    <div aria-hidden="true" className="flex w-full flex-col overflow-hidden pb-5 lg:max-w-182.5">
      <div className="mb-4 flex w-full flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <CartLineSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="mt-7.5 h-15 w-full rounded-panel md:h-11.25" />
    </div>
  );
};

export default CartListSkeleton;
