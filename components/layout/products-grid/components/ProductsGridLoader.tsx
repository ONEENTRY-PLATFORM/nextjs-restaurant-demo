'use client';

import type { JSX } from 'react';

import type { LoaderProps } from '@/app/types/global';

import ProductsGridLoaderAnimations from '../animations/ProductsGridLoaderAnimations';

/**
 * ProductsGridLoader
 */
const ProductsGridLoader = ({
  productsLimit = 10,
}: LoaderProps): JSX.Element => {
  return (
    <ProductsGridLoaderAnimations
      className={'relative box-border flex w-full shrink-0 flex-col'}
    >
      <section className="relative mx-auto box-border flex min-h-25 w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch">
        <div className="menu_items grid w-full grid-cols-2 max-md:[&>.menu_item]:w-full md:grid-cols-4">
          {Array.from(Array(productsLimit).keys()).map((item) => (
            <div
              key={item}
              className={
                'menu_item product-card relative flex min-h-90 flex-col items-center rounded-[5px] bg-ink/30 p-4 opacity-40'
              }
            >
              <div className="relative mb-3 size-36 w-full rounded-md bg-paper/20 opacity-40"></div>
              <div className="z-10 mb-4 mt-auto flex h-6 w-full flex-col rounded-full bg-paper/20 opacity-30"></div>
              <div className="z-10 mb-2 mt-auto flex h-4 w-full flex-col gap-2.5 rounded-full bg-paper/20 opacity-30"></div>
              <div className="z-10 mb-2 mt-auto flex h-4 w-full flex-col gap-2.5 rounded-full bg-paper/20 opacity-30"></div>
              <div className="z-10 mb-4 mt-auto flex h-8 w-full flex-col gap-2.5 rounded-full bg-paper/20 opacity-30"></div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex h-8 w-full"></div>
      </section>
    </ProductsGridLoaderAnimations>
  );
};

export default ProductsGridLoader;
