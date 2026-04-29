import type { JSX } from 'react';

import FavoritesGrid from '@/components/profile/FavoritesGrid';

export const dynamic = 'force-dynamic';

/**
 * Favorites tab of the profile dashboard — port of
 * `static-html/pk_favorites.html`.
 * @returns {JSX.Element} Favorites page JSX.
 */
const ProfileFavoritesPage = (): JSX.Element => {
  return <FavoritesGrid />;
};

export default ProfileFavoritesPage;
