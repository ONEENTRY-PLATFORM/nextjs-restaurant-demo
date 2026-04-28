'use client';

import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';

/**
 * Nav item favorites button — opens the {@link FavoritesPopup} drawer via
 * `OpenDrawerContext` (`component === 'FavoritesPopup'`). Mirrors the
 * `static-html` heart-icon trigger: favorites are a slide-in popup, not a
 * standalone page.
 * @returns {JSX.Element} Favorites button JSX.
 */
const NavItemFavorites = (): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const items = useAppSelector(selectFavoritesItems);
  const count = items?.length ?? 0;
  // Persisted slice rehydrates client-side — gate the badge to prevent
  // server/client markup divergence (same trick as NavItemCart).
  const mounted = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('FavoritesPopup');
        setOpen(true);
      }}
      className="group relative my-auto box-border flex shrink-0"
      aria-label="Favorites"
    >
      <FavoritesIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-[#ec722b]">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default NavItemFavorites;
