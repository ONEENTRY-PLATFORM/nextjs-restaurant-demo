'use client';

import Link from 'next/link';
import { type JSX, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import CartIcon from '@/components/icons/cart';

const NavItemCart = (): JSX.Element => {
  const items = useAppSelector(selectCartData) as Array<{ id: number }>;
  const count = items?.length ?? 0;
  // Redux store гидратируется из localStorage только на клиенте — пропускаем
  // бейдж на первом рендере, чтобы серверная и клиентская разметка совпадали.
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
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-brand">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </Link>
  );
};

export default NavItemCart;
