'use client';

import Link from 'next/link';
import type { JSX } from 'react';

import CartIcon from '@/components/icons/cart';

/**
 * Nav item cart button
 * @returns JSX.Element
 */
const NavItemCart = (): JSX.Element => {
  return (
    <Link
      prefetch={false}
      href="/cart"
      className="group relative my-auto box-border flex shrink-0"
      aria-label="Cart"
    >
      <CartIcon />
      <div className="py-0.5 px-[5px] absolute top-[-3px] right-[-7px] rounded-full bg-[#ec722b]">
        <p className="font-bold text-[8px] text-black">2</p>
      </div>
    </Link>
  );
};

export default NavItemCart;
