import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import FavoritesGrid from '@/components/profile/FavoritesGrid';

export const dynamic = 'force-dynamic';

/**
 * ProfileFavoritesPage — вкладка избранного в личном кабинете (2-колоночный layout).
 * @returns {Promise<JSX.Element>} JSX страницы избранного.
 */
const ProfileFavoritesPage = async (): Promise<JSX.Element> => {
  const banners = await getBlogBanners();

  return (
    <div className="md:flex md:justify-between md:gap-15">
      <div className="md:w-1/2">
        <FavoritesGrid />
      </div>
      <CartPromoSidebar banners={banners} />
    </div>
  );
};

export default ProfileFavoritesPage;
