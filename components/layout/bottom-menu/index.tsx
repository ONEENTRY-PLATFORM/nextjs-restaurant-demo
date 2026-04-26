import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { getMenuByMarker } from '@/app/api';

import CenterCartButton from './components/CenterCartButton';
import CenterCloseButton from './components/CenterCloseButton';
import NavItemCalendar from './components/NavItemCalendar';
import NavItemCatalog from './components/NavItemCatalog';
import NavItemHome from './components/NavItemHome';
import NavItemProfile from './components/NavItemProfile';

const HOME_URL = 'home_web';
const CATALOG_URL = 'menu';
const CALENDAR_URL = 'reservation';
const PROFILE_URL = 'profile';

/**
 * Bottom fixed navigation for mobile — 1:1 port of `static-html/.../MenuBottom`:
 * clipped polygon notch background, two left/right icon groups driven by
 * OneEntry `bottom_web` menu, and central protruding orange cart + outlined
 * close pair as the design centerpiece.
 */
const BottomMobileMenu = async (): Promise<JSX.Element> => {
  const { menu, isError, error } = await getMenuByMarker('bottom_web');

  if (isError || !menu) {
    // eslint-disable-next-line no-console
    console.warn(
      '[BottomMenu] Menu "bottom_web" unavailable — rendering empty bar.',
      error,
    );
  }

  const pages: IMenusPages[] =
    menu && Array.isArray(menu.pages) ? menu.pages : [];

  const homeItem = pages.find((p) => p.pageUrl === 'home_web');
  const calendarItem = pages.find((p) => p.pageUrl === 'reservation');
  const catalogItem = pages.find((p) => p.pageUrl === 'menu');
  const profileItem = pages.find((p) => p.pageUrl === 'profile');

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-30 w-full h-19 bg-cover bg-center">
      <div className="max-w-87.5 mx-auto flex justify-between h-19">
        <div className="flex justify-start gap-11.25 mobile_wide:gap-7.5 items-center mx-auto w-1/3 z-50">
          {homeItem && (
            <div className="group">
              <NavItemHome item={homeItem} />
            </div>
          )}
          {calendarItem && (
            <div className="group_stroke">
              <NavItemCalendar item={calendarItem} />
            </div>
          )}
        </div>

        <div className="w-1/3 flex justify-center items-start -mt-5 p-5">
          <CenterCartButton />
          <CenterCloseButton />
        </div>

        <div className="flex justify-end gap-11.25 mobile_wide:gap-7.5 items-center mx-auto w-1/3 z-50">
          {catalogItem && (
            <div className="group">
              <NavItemCatalog item={catalogItem} />
            </div>
          )}
          {profileItem && (
            <div className="group">
              <NavItemProfile item={profileItem} />
            </div>
          )}
        </div>
      </div>
      <div className="clipped-div fixed -bottom-0.5 left-0 z-40 bg-black" />
    </div>
  );
};

export default BottomMobileMenu;
