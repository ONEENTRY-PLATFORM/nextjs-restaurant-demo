import type { JSX } from 'react';

import FavoritesGrid from '@/components/profile/FavoritesGrid';

export const dynamic = 'force-dynamic';

/**
 * Вкладка избранного в личном кабинете — порт
 * `static-html/pk_favorites.html`.
 * @returns {JSX.Element} JSX страницы избранного.
 */
const ProfileFavoritesPage = (): JSX.Element => {
  return <FavoritesGrid />;
};

export default ProfileFavoritesPage;
