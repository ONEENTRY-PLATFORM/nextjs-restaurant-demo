'use client';

import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * NavItemFavorites — favorites button in the bottom menu; toggles `FavoritesPopup` and shows a count badge.
 *
 * @returns JSX of the favorites button with count badge (only after mount).
 */
const NavItemFavorites = (): JSX.Element => {
  const t = useT();
  const { open, component, transition, setOpen, setComponent, setTransition } =
    useContext(OpenDrawerContext);
  const items = useAppSelector(selectFavoritesItems);
  const count = items?.length ?? 0;
  const mounted = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );

  const handleClick = () => {
    if (open && component === 'FavoritesPopup' && transition !== 'close') {
      setTransition('close');
      return;
    }
    setComponent('FavoritesPopup');
    setOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={() => prefetchPopup('FavoritesPopup')}
      onFocus={() => prefetchPopup('FavoritesPopup')}
      aria-label={t('favorites_label', 'Favorites')}
      className="group relative box-border flex size-6 shrink-0"
    >
      <FavoritesIcon />
      {mounted && count > 0 && (
        <div className="absolute -top-0.75 -right-1.75 rounded-full bg-brand px-1.25 py-0.5">
          <p className="text-[8px] font-bold text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default NavItemFavorites;
