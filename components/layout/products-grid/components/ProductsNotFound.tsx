import Image from 'next/image';
import Link from 'next/link';
import { type JSX } from 'react';

/**
 * ProductsNotFound — empty state for the product grid.
 *
 * Shown when `getProducts` returns nothing (search/filter without results, or no products in the category).
 *
 * @returns {JSX.Element} JSX of the empty-state card with a "Reset & browse all" link.
 */
const ProductsNotFound = (): JSX.Element => {
  return (
    <div className="mx-auto flex w-full max-w-100 flex-col items-center gap-4 py-12 text-center text-paper">
      <div className="flex size-20 items-center justify-center rounded-full border border-brand/40 bg-ink/40">
        <Image
          width={36}
          height={36}
          src="/images/icons/search.svg"
          alt=""
          className="opacity-80"
        />
      </div>
      <h2 className="font-semibold text-2xl text-paper">Products not found</h2>
      <p className="text-base text-muted-text">
        Try adjusting your filters or search query - nothing matched this combination.
      </p>
      <Link
        href="/shop"
        className="mt-2 rounded-panel bg-custom-gradient py-2.5 font-bold text-base uppercase text-white hover:bg-gradient-to-r-hover px-5"
      >
        Reset & browse all
      </Link>
    </div>
  );
};

export default ProductsNotFound;
