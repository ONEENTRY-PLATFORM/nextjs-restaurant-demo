'use client';

/* eslint-disable @next/next/no-img-element */
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Central protruding cart button — 1:1 port of the orange ball from
 * `static-html/.../MenuBottom`. Opens the cart drawer via `OpenDrawerContext`
 * (`component === 'CartPopup'`) — same drawer pattern as the filter sheet.
 * Hidden while any drawer is open so it doesn't overlap the open sheet.
 * Badge is mount-gated to avoid a hydration mismatch when the persisted cart
 * rehydrates client-side.
 */
const CenterCartButton = (): JSX.Element | null => {
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);
  const count = useAppSelector(
    (state) => state.cartReducer.productsData?.length ?? 0,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (open) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('CartPopup');
        setOpen(true);
      }}
      aria-label="Open cart"
      className="bg-[#ec722b] hover:bg-[#EB4B0E] w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 relative"
    >
      <img
        className="w-6.25 h-5.75"
        src="/images/icons/cart_black.svg"
        alt="cart"
      />
      {mounted && count > 0 && (
        <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-white border border-[#ec722b]">
          <p className="font-bold text-[10px] leading-none text-black">
            {count}
          </p>
        </div>
      )}
    </button>
  );
};

export default CenterCartButton;
