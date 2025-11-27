'use client';

import Link from 'next/link';
import type { JSX } from 'react';

import FavoritesIcon from '@/components/icons/favorites';

/**
 * Nav item favorites button
 * @returns JSX.Element
 */
const NavItemFavorites = (): JSX.Element => {
  return (
    <Link
      prefetch={false}
      href="/favorites"
      className="group relative my-auto box-border flex shrink-0"
      aria-label="Favorites"
    >
      <FavoritesIcon />
    </Link>
  );
};

export default NavItemFavorites;
