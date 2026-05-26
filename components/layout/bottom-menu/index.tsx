import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { ComponentType, JSX } from 'react';

import { getMenuByMarker } from '@/app/api';
import { MENUS, PAGES } from '@/app/utils/constants';

import CenterCartButton from './components/CenterCartButton';
import CenterCloseButton from './components/CenterCloseButton';
import NavItemCalendar from './components/NavItemCalendar';
import NavItemCatalog from './components/NavItemCatalog';
import NavItemFavorites from './components/NavItemFavorites';
import NavItemHome from './components/NavItemHome';
import NavItemProfile from './components/NavItemProfile';

type NavConfig = {
  Component: ComponentType<{ item: IMenusPages }>;
  groupClass: string;
};

const NAV_BY_URL: Record<string, NavConfig> = {
  [PAGES.home]: { Component: NavItemHome, groupClass: 'group' },
  [PAGES.favorites]: { Component: NavItemFavorites, groupClass: 'group_stroke' },
  [PAGES.menu]: { Component: NavItemCatalog, groupClass: 'group' },
  [PAGES.profile]: { Component: NavItemProfile, groupClass: 'group' },
  [PAGES.bookings]: { Component: NavItemCalendar, groupClass: 'group_stroke' },
};

/**
 * BottomMobileMenu — fixed mobile bottom navigation built from the `bottom_web` menu + central Cart/Close pair.
 *
 * @returns JSX of the fixed bottom navigation bar (rendered only below md).
 */
const BottomMobileMenu = async (): Promise<JSX.Element> => {
  const { menu, isError, error } = await getMenuByMarker(MENUS.bottomWeb);

  if (isError || !menu) {
    // eslint-disable-next-line no-console
    console.warn('[BottomMenu] Menu "bottom_web" unavailable - rendering empty bar.', error);
  }

  const pages: IMenusPages[] = menu && Array.isArray(menu.pages) ? menu.pages : [];

  const navItems = pages.flatMap(page => {
    const config = page.pageUrl ? NAV_BY_URL[page.pageUrl] : undefined;
    return config ? [{ page, ...config }] : [];
  });

  const half = Math.ceil(navItems.length / 2);
  const leftItems = navItems.slice(0, half);
  const rightItems = navItems.slice(half);

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-600 w-full h-19 bg-cover bg-center">
      <div className="max-w-[90vw] sm:max-w-[70vw] mx-auto flex justify-between h-19">
        <div className="relative flex justify-start gap-11.25 mobile_wide:gap-12 items-center mx-auto w-1/3 z-50">
          {leftItems.map(({ page, Component, groupClass }) => (
            <div key={page.pageUrl} className={groupClass}>
              <Component item={page} />
            </div>
          ))}
        </div>

        <div className="relative w-1/3 flex justify-center items-start -mt-5 p-5 z-50">
          {/* Cart/close stack - crossfade via opacity+rotate+scale driven by `OpenDrawerContext.open`. */}
          <div className="relative w-11.5 h-11.5 -mt-2.5">
            <CenterCartButton />
            <CenterCloseButton />
          </div>
        </div>

        <div className="relative flex justify-end gap-11.25 md:gap-20 mobile_wide:gap-12 items-center mx-auto w-1/3 z-50">
          {rightItems.map(({ page, Component, groupClass }) => (
            <div key={page.pageUrl} className={groupClass}>
              <Component item={page} />
            </div>
          ))}
        </div>
      </div>
      <div className="clipped-div fixed -bottom-0.5 left-0 z-40 backdrop-blur-card" />
    </div>
  );
};

export default BottomMobileMenu;
