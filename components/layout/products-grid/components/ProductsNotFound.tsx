'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

/**
 * ProductsNotFound — empty state for the product grid.
 *
 * @returns JSX of the empty-state card with a "Reset & browse all" link.
 */
const ProductsNotFound = (): JSX.Element => {
  const t = useT();
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
      <h2 className="text-2xl font-semibold text-paper">
        {t('products_not_found_title', 'Products not found')}
      </h2>
      <p className="text-base text-muted-text">
        {t(
          'products_not_found_text',
          'Try adjusting your filters or search query - nothing matched this combination.'
        )}
      </p>
      <Link
        href="/shop"
        className="mt-2 rounded-panel bg-custom-gradient px-5 py-2.5 text-base font-bold text-white uppercase transition-all duration-200 hover:bg-gradient-to-r-hover active:bg-gradient-to-r-hover"
      >
        {t('reset_filters_button', 'Reset & browse all')}
      </Link>
    </div>
  );
};

export default ProductsNotFound;
