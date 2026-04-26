'use client';

import Link from 'next/link';
/* eslint-disable @next/next/no-img-element */
import type { JSX } from 'react';

import { useAppSelector } from '@/app/store/hooks';

/**
 * Central protruding cart button — 1:1 port of the orange ball from
 * `static-html/.../MenuBottom`. Reads cart count from `cartReducer.productsData`
 * and links to `/cart`.
 */
const CenterCartButton = (): JSX.Element => {
  const count = useAppSelector(
    (state) => state.cartReducer.productsData?.length ?? 0,
  );

  return (
    <Link
      href="/cart"
      prefetch={false}
      className="bg-[#ec722b] hover:bg-[#EB4B0E] w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 relative"
    >
      <img
        className="w-6.25 h-5.75"
        src="/images/icons/cart_black.svg"
        alt="cart"
      />
      {count > 0 && (
        <div className="px-1 absolute top-2.5 right-2 rounded-full bg-white">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </Link>
  );
};

export default CenterCartButton;
