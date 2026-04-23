import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX, Key } from 'react';

import { getMenuByMarker } from '@/app/api';

import NavItemCalendar from './components/NavItemCalendar';
import NavItemCatalog from './components/NavItemCatalog';
import NavItemHome from './components/NavItemHome';
import NavItemProfile from './components/NavItemProfile';

/**
 * Bottom fixed navigation for mobile — glass transparent bar with clipped
 * polygon center slot (matches static-html `.clipped-div`).
 */
const BottomMobileMenu = async (): Promise<JSX.Element> => {
  // Get Menu by marker from api
  const { menu, isError, error } = await getMenuByMarker('bottom_web');

  if (isError || !menu) {
    // eslint-disable-next-line no-console
    console.warn(
      '[BottomMenu] Menu "bottom_web" unavailable — rendering empty bar.',
      error,
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-40 w-full h-19 backdrop-blur-[10px]">
      <div className="clipped-div absolute inset-0" />
      <div className="relative max-w-88 mx-auto flex justify-between h-19 items-center px-6">
        {menu &&
          Array.isArray(menu.pages) &&
          menu.pages.map((item: IMenusPages, i: Key) => {
            return (
              <div className="flex size-6 nav_bottom" key={i}>
                {item.pageUrl === 'home' && <NavItemHome item={item} />}
                {(item.pageUrl === 'services' ||
                  item.pageUrl === 'catalog' ||
                  item.pageUrl === 'shop') && <NavItemCatalog item={item} />}
                {(item.pageUrl === 'masters' ||
                  item.pageUrl === 'reservation') && (
                  <NavItemCalendar item={item} />
                )}
                {item.pageUrl === 'profile' && <NavItemProfile item={item} />}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default BottomMobileMenu;
