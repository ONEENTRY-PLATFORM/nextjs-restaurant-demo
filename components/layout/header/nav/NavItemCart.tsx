'use client';

import Link from 'next/link';
import { type JSX, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import CartIcon from '@/components/icons/cart';

const NavItemCart = (): JSX.Element => {
  const items = useAppSelector(selectCartData) as Array<{ id: number }>;
  const count = items?.length ?? 0;
  // Redux store hydrates from localStorage on the client only — skip the
  // badge on the first render to keep server/client markup in sync.
  const mounted = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );

  return (
    <Link
      prefetch={false}
      href="/cart"
      className="group relative my-auto box-border flex shrink-0"
      aria-label="Cart"
    >
      <CartIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-[5px] absolute top-[-3px] right-[-7px] rounded-full bg-[#ec722b]">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </Link>
  );
};

export default NavItemCart;
