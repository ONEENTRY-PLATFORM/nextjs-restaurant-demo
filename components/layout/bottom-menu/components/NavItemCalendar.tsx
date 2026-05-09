'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import HeartScriptIcon from '@/components/icons/heart-script';

/** Calendar (bookings) nav item button. */
const NavItemCalendar = ({ item }: { item: IMenusPages }): JSX.Element => {
  const cartCount = useAppSelector(state => {
    return state.cartReducer.reservations?.length;
  });

  const { pageUrl, localizeInfos } = item;

  return (
    <Link
      prefetch={false}
      href={'/' + pageUrl}
      title={localizeInfos?.menuTitle ?? undefined}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <HeartScriptIcon />
      {cartCount && (
        <div className="absolute -right-1 -top-1 z-10 size-4 rounded-full bg-brand text-center text-sm leading-4">
          {cartCount}
        </div>
      )}
    </Link>
  );
};

export default NavItemCalendar;
