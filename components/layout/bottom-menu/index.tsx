import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { type Key } from 'react';

import { getMenuByMarker } from '@/app/api';

import NavItemCalendar from './components/NavItemCalendar';
import NavItemCatalog from './components/NavItemCatalog';
import NavItemHome from './components/NavItemHome';
import NavItemProfile from './components/NavItemProfile';

/**
 * Bottom menu for mobile devices
 */
const BottomMobileMenu = async (): Promise<JSX.Element> => {
  // Get Menu by marker from api
  const { menu, isError } = await getMenuByMarker('bottom_web');

  return (
    <div className="z-500 fixed bottom-0 my-auto hidden h-[60px] w-full items-center justify-between gap-10 bg-white p-4 max-md:flex">
      {!isError &&
        menu &&
        Array.isArray(menu.pages) &&
        menu.pages.map((item: IMenusPages, i: Key) => {
          return (
            <div className="flex size-6" key={i}>
              {item.pageUrl === 'home' && <NavItemHome item={item} />}
              {item.pageUrl === 'services' && <NavItemCatalog item={item} />}
              {item.pageUrl === 'masters' && <NavItemCalendar item={item} />}
              {item.pageUrl === 'profile' && <NavItemProfile item={item} />}
            </div>
          );
        })}
    </div>
  );
};

export default BottomMobileMenu;
