'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import HomeIcon from '@/components/icons/home';

/**
 * Home navItem menu element
 */
const NavItemHome = ({
  item: { localizeInfos },
}: {
  item: IMenusPages;
}): JSX.Element => {
  return (
    <Link
      href={'/'}
      prefetch={false}
      title={localizeInfos.menuTitle}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <HomeIcon />
    </Link>
  );
};

export default NavItemHome;
