import type { JSX } from 'react';

import Skeleton from './Skeleton';

/**
 * CartLineSkeleton — one cart line: thumbnail, two text rows, quantity stepper and price.
 *
 * @returns JSX of a single cart line skeleton.
 */
export const CartLineSkeleton = (): JSX.Element => (
  <div className="flex items-center gap-4 border-b border-paper/10 pb-5">
    <Skeleton className="size-20 shrink-0 rounded-card" />
    <div className="flex grow flex-col gap-2.5">
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-3.5 w-1/3 rounded-full" />
    </div>
    <Skeleton className="h-9 w-24 shrink-0 rounded-card" />
    <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
  </div>
);

/**
 * CartSkeleton — loading skeleton for the cart / checkout wizard (`/cart`).
 *
 * Reproduces the cart layout: a column of cart lines plus an order-summary card on the left, and the promo sidebar on the right (desktop only).
 *
 * @returns JSX of the cart skeleton.
 */
const CartSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in min-h-screen bg-black">
      <div className="mx-auto w-full max-w-85 px-4 pt-6 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323">
        {/* Step heading */}
        <Skeleton className="mb-6 h-7 w-48" />

        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-15">
          {/* Cart lines + summary */}
          <div className="flex w-full flex-col gap-7.5 lg:flex-1">
            <div className="flex flex-col gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <CartLineSkeleton key={i} />
              ))}
            </div>

            {/* Order summary */}
            <div className="flex flex-col gap-3 rounded-panel bg-ink/40 p-5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-12 w-full rounded-card" />
            </div>
          </div>

          {/* Promo sidebar (desktop) */}
          <div className="hidden w-full max-w-90 shrink-0 flex-col gap-5 lg:flex">
            <Skeleton className="h-60 w-full rounded-panel" />
            <Skeleton className="h-60 w-full rounded-panel" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSkeleton;
