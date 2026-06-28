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
 * Mirrors the real cart-step layout: mobile header / desktop breadcrumbs, then two equal `md:w-1/2` columns from the `md` breakpoint — cart lines plus the APPLY button on the left, the promo banner sidebar on the right (md+ only).
 *
 * @returns JSX of the cart skeleton.
 */
const CartSkeleton = (): JSX.Element => {
  return (
    <section aria-hidden="true" className="skeleton-fade-in min-h-screen bg-black">
      <div className="mx-auto w-full max-w-85 px-4 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323">
        {/* Mobile header: back / title / burger */}
        <div className="flex items-center justify-between p-5 pb-0 md:hidden">
          <Skeleton className="size-6 shrink-0 rounded-card" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="size-6 shrink-0 rounded-card" />
        </div>

        {/* Desktop breadcrumbs */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Skeleton className="size-4 shrink-0 rounded-card" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>

        {/* Stacked on mobile, 2 columns (50/50) on md+ */}
        <div className="gap-8 px-5 pt-10 pb-5 md:flex md:justify-between md:px-0 md:pt-13 lg:gap-15">
          {/* Cart lines + APPLY button — mirrors CartListSkeleton */}
          <div className="flex flex-col gap-4 md:w-1/2">
            <div className="flex w-full flex-col overflow-hidden pb-5 lg:max-w-182.5">
              <div className="mb-4 flex w-full flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CartLineSkeleton key={i} />
                ))}
              </div>
              <Skeleton className="mt-7.5 h-15 w-full rounded-panel md:h-11.25" />
            </div>
          </div>

          {/* Promo sidebar (md+) — equal 50/50 width, banner aspect ratio */}
          <div className="hidden w-1/2 flex-col gap-10 md:flex">
            <Skeleton className="aspect-615/278 w-full rounded-panel" />
            <Skeleton className="aspect-615/278 w-full rounded-panel" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSkeleton;
