'use client';

import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';
import { prefetchPopup } from '@/components/layout/popupRegistry';

/**
 * NavItemFavorites — desktop favorites trigger; opens `FavoritesPopup` and shows a count badge.
 *
 * @returns JSX of the favorites button with rehydrated count badge.
 */
const NavItemFavorites = (): JSX.Element => {
  const t = useT();
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
      onPointerEnter={() => prefetchPopup('FavoritesPopup')}
      onFocus={() => prefetchPopup('FavoritesPopup')}
      aria-label={t('favorites_label', 'Favorites')}
      className="group relative my-auto box-border flex shrink-0"
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
