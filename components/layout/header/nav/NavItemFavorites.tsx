'use client';

import Link from 'next/link';
import { type JSX, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';

/**
 * Nav item favorites button
 * @returns JSX.Element
 */
const NavItemFavorites = (): JSX.Element => {
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
    <Link
      prefetch={false}
      href="/profile/favorites"
      className="group relative my-auto box-border flex shrink-0"
      aria-label="Favorites"
    >
      <FavoritesIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-[#ec722b]">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </Link>
  );
};

export default NavItemFavorites;
