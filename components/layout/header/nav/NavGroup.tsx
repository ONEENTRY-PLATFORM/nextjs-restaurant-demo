import type { JSX } from 'react';

import HouseIcon from '@/components/icons/house';

import MenuButton from './MenuButton';
import NavItemCart from './NavItemCart';
import NavItemFavorites from './NavItemFavorites';
import NavItemProfile from './NavItemProfile';

/**
 * Группа пользовательской навигации
 */
const NavGroup = (): JSX.Element => {
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
        <NavItemProfile />
      </div>
      <MenuButton />
    </div>
  );
};

export default NavGroup;
