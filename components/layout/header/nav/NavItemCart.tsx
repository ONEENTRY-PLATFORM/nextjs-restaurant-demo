'use client';

import Link from 'next/link';
import { type JSX, useSyncExternalStore } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { resetCheckout } from '@/app/store/reducers/OrderSlice';
import CartIcon from '@/components/icons/cart';

/**
 * NavItemCart — desktop header cart link with a count badge that hydrates only on the client.
 *
 * @returns JSX of the cart link.
 */
const NavItemCart = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartData) as Array<{ id: number }>;
  const count = items?.length ?? 0;
  const mounted = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );

  return (
    <Link
      href="/cart"
      onClick={() => dispatch(resetCheckout())}
      className="group relative my-auto box-border flex shrink-0"
      aria-label={t('cart_label', 'Cart')}
    >
      <CartIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-brand">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </Link>
  );
};

export default NavItemCart;
