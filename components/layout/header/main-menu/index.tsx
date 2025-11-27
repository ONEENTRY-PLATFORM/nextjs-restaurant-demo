import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

import { flatMenuToNested } from '@/components/utils';

import MainMenuLoader from './components/MenuLoader';
import NavigationMenu from './components/NavigationMenu';

/**
 * Main menu component.
 */
const MainMenu = async ({ menu }: { menu: IMenusEntity }): Promise<JSX.Element> => {
  if (!menu?.pages) {
    return <MainMenuLoader limit={4} />;
  }

  // Convert menu flat array to nested structure
  const mainMenu = flatMenuToNested(
    Array.isArray(menu.pages) ? menu.pages : [],
    null,
  );

  return <NavigationMenu menu={mainMenu} />;
};

export default MainMenu;
