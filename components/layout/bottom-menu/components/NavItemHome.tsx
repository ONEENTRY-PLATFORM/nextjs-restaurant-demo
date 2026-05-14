import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import HouseIcon from '@/components/icons/house';

/**
 * NavItemHome — "Home" nav-item link rendered in the mobile bottom menu.
 *
 * @param   {object}      props      - Component props.
 * @param   {IMenusPages} props.item - OneEntry menu page entity (only `localizeInfos.menuTitle` is used).
 * @returns JSX of the home link with house icon.
 */
const NavItemHome = ({ item: { localizeInfos } }: { item: IMenusPages }): JSX.Element => {
  return (
    <Link
      href={'/'}
      prefetch={false}
      title={localizeInfos.menuTitle ?? undefined}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <HouseIcon />
    </Link>
  );
};

export default NavItemHome;
