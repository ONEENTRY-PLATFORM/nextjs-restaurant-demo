'use client';

import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';

/** NavItemFavorites — desktop favorites trigger; opens `FavoritesPopup`. */
const NavItemFavorites = (): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const items = useAppSelector(selectFavoritesItems);
  const count = items?.length ?? 0;
  // Persisted slice rehydrates on the client — gate the badge (see NavItemCart).
  const mounted = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('FavoritesPopup');
        setOpen(true);
      }}
      aria-label="Favorites"
      className="group relative my-auto box-border flex shrink-0"
    >
      <FavoritesIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-brand">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default NavItemFavorites;
