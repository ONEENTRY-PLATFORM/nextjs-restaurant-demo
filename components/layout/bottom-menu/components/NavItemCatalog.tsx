'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import CatalogIcon from '@/components/icons/catalog';

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
      title={localizeInfos.menuTitle}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <CatalogIcon />
    </Link>
  );
};

export default NavItemCatalog;
