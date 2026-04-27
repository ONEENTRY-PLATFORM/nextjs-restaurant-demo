'use client';

/* eslint-disable @next/next/no-img-element */
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { openCartPopup } from '@/app/store/reducers/CartSlice';

/**
 * Central protruding cart button — 1:1 port of the orange ball from
 * `static-html/.../MenuBottom`. Reads cart count from `cartReducer.productsData`
 * and opens the cart popup (`cart_cart.html`). Badge is mount-gated to avoid
 * a hydration mismatch when the persisted cart rehydrates client-side.
 */
const CenterCartButton = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const count = useAppSelector(
    (state) => state.cartReducer.productsData?.length ?? 0,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => dispatch(openCartPopup())}
      aria-label="Open cart"
      className="bg-[#ec722b] hover:bg-[#EB4B0E] w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 relative"
    >
      <img
        className="w-6.25 h-5.75"
        src="/images/icons/cart_black.svg"
        alt="cart"
      />
      {mounted && count > 0 && (
        <div className="px-1 absolute top-2.5 right-2 rounded-full bg-white">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default CenterCartButton;
