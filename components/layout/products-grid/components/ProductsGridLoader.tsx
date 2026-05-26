import type { JSX, ReactNode } from 'react';

import type { LoaderProps } from '@/app/types/global';

import CardAnimations from '../animations/CardAnimations';

type Props = LoaderProps & {
  /** When true, animate scale only (no fade). Use for the overlay skeleton in `ProductsGridReveal` - the parent handles the opacity fade-out, and the skeleton's scale must track the card underneath in lockstep. */
  scaleOnly?: boolean;
};

/**
 * SkeletonBody — pulsing placeholder rows that mirror the inner layout of `ProductCard`.
 *
 * @returns JSX of the skeleton inner content.
 */
export const SkeletonBody = (): ReactNode => (
  <>
    <div className="absolute right-2.5 top-3.75 z-10 h-5.25 w-6.5 animate-pulse rounded-md bg-paper/15 md:right-3.75 md:top-5 md:h-7.5 md:w-9.5" />
    <div className="relative aspect-square w-full animate-pulse overflow-hidden rounded-card bg-paper/10" />
    <div className="relative z-10 -mt-8 flex h-8.5 items-center justify-around bg-custom_black px-2.5 md:-mt-10.75 md:h-11">
      <div className="h-3 w-12 animate-pulse rounded-full bg-paper/20" />
      <div className="h-3 w-10 animate-pulse rounded-full bg-paper/20" />
      <div className="h-3 w-10 animate-pulse rounded-full bg-paper/20" />
    </div>
    <div className="mb-2 mt-3 flex grow flex-col gap-2 md:mb-3 md:mt-4.25">
      <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-paper/20" />
      <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-paper/20" />
    </div>
    <div className="flex items-center justify-between gap-2.5 rounded-[7px] border border-paper/15 px-4.75 py-1.5 md:gap-3.25 md:py-2.5">
      <div className="h-4 w-6 animate-pulse rounded-full bg-paper/20" />
      <div className="h-5 w-7.25 animate-pulse rounded-md bg-paper/20 md:h-6.75" />
      <div className="ml-auto h-4 w-10 animate-pulse rounded-full bg-paper/20" />
    </div>
  </>
);

/**
 * ProductsGridLoader — product-card grid skeleton (mirrors `ProductCard` layout) with staggered fade-in.
 *
 * @param   {Props}   props                 - Component props.
 * @param   {number}  [props.productsLimit] - Number of skeleton cards to render (defaults to 8).
 * @param   {boolean} [props.scaleOnly]     - When `true`, only animate scale (used as overlay in `ProductsGridReveal`).
 * @returns JSX of the skeleton grid.
 */
const ProductsGridLoader = ({ productsLimit = 8 }: Props): JSX.Element => {
  return (
    <section aria-hidden="true" className="products_grid_layout">
      <div className="menu_items">
        {Array.from(Array(productsLimit).keys()).map(item => (
          <CardAnimations
            key={item}
            className="menu_item relative flex flex-col"
            index={item}
            productsLimit={productsLimit}
          >
            <SkeletonBody />
          </CardAnimations>
        ))}
      </div>
      <div className="mt-5 flex h-8 w-full" />
    </section>
  );
};

export default ProductsGridLoader;
