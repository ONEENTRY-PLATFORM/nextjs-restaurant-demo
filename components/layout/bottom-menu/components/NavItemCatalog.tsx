'use client';

import type { IMenusPages } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import LinesBulletsIcon from '@/components/icons/lines-bullets';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * NavItemCatalog — catalog nav-item button in the mobile bottom menu; toggles the `CategoryFilter` drawer.
 *
 * @param   {object}      props      - Component props.
 * @param   {IMenusPages} props.item - OneEntry menu page entity (only `localizeInfos.menuTitle` is used).
 * @returns JSX of the catalog button.
 */
const NavItemCatalog = ({ item: { localizeInfos } }: { item: IMenusPages }): JSX.Element => {
  const { open, component, transition, setOpen, setComponent, setTransition } =
    useContext(OpenDrawerContext);

  const handleClick = () => {
    if (open && component === 'CategoryFilter' && transition !== 'close') {
      setTransition('close');
      return;
    }
    setOpen(true);
    setComponent('CategoryFilter');
  };

  return (
    <button
      type="button"
      title={localizeInfos.menuTitle ?? undefined}
      onClick={handleClick}
      onPointerEnter={() => prefetchPopup('CategoryFilter')}
      onFocus={() => prefetchPopup('CategoryFilter')}
      className="group relative box-border flex size-6 shrink-0 flex-col"
    >
      <LinesBulletsIcon />
    </button>
  );
};

export default NavItemCatalog;
