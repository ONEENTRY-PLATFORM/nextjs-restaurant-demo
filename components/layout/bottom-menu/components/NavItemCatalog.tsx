'use client';

import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import LinesBulletsIcon from '@/components/icons/lines-bullets';

/**
 * NavItemCatalog — catalog nav-item button in the mobile bottom menu; opens the `CategoryFilter` drawer.
 *
 * @param   {object}      props      - Component props.
 * @param   {IMenusPages} props.item - OneEntry menu page entity (only `localizeInfos.menuTitle` is used).
 * @returns JSX of the catalog button.
 */
const NavItemCatalog = ({ item: { localizeInfos } }: { item: IMenusPages }): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      type="button"
      title={localizeInfos.menuTitle ?? undefined}
      onClick={() => {
        setOpen(true);
        setComponent('CategoryFilter');
      }}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <LinesBulletsIcon />
    </button>
  );
};

export default NavItemCatalog;
