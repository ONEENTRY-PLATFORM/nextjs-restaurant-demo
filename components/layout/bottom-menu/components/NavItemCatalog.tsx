'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import LinesBulletsIcon from '@/components/icons/lines-bullets';

/**
 * Catalog navigation menu item
 */
const NavItemCatalog = ({
  item: { pageUrl, localizeInfos },
}: {
  item: IMenusPages;
}): JSX.Element => {
  return (
    <Link
      prefetch={false}
      href={'/' + pageUrl}
      title={localizeInfos.menuTitle ?? undefined}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <LinesBulletsIcon />
    </Link>
  );
};

export default NavItemCatalog;
