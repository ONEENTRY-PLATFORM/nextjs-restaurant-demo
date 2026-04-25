import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { getMenuByMarker } from '@/app/api';
import HouseIcon from '@/components/icons/house';

// import { ServerProvider } from '@/app/store/providers/ServerProvider';
// import FavoritesIcon from '@/components/icons/favorites';
import MenuButton from './MenuButton';
import NavItemCart from './NavItemCart';
import NavItemFavorites from './NavItemFavorites';
import NavItemProfile from './NavItemProfile';

/**
 * User navigation group
 */

const NavGroup = async (): Promise<JSX.Element> => {
  // const [dict] = ServerProvider('dict');
  const { menu, isError, error } = await getMenuByMarker('user_menu');

  if (!menu || isError) {
    // eslint-disable-next-line no-console
    console.warn(
      '[NavGroup] Menu "user_menu" unavailable — rendering without profile nav item.',
      error,
    );
  }

  return (
    <div className="flex justify-between relative self-end cursor-pointer">
      <div className="gap-8 max-md:gap-6 max-sm:gap-4 flex">
        <div className="group">
          <a href="#">
            <HouseIcon size="lg" />
          </a>
        </div>
        <NavItemCart />
        <NavItemFavorites />
        {menu ? <NavItemProfile userMenu={menu as IMenusEntity} /> : null}
      </div>
      <MenuButton />
    </div>
  );
};

export default NavGroup;
