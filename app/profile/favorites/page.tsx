import type { JSX } from 'react';

import FavoritesList from '@/components/profile/FavoritesList';

export const dynamic = 'force-dynamic';

/**
 * Favorites tab of the profile dashboard.
 * @returns {JSX.Element} Favorites page JSX.
 */
const ProfileFavoritesPage = (): JSX.Element => {
  return <FavoritesList />;
};

export default ProfileFavoritesPage;
