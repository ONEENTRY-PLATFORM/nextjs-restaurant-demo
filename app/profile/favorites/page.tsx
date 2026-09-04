import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api/server/pages/getBlogBanners';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import FavoritesGrid from '@/components/profile/favorites/FavoritesGrid';
import { blogBannerFromPage } from '@/components/promo/blogBanner';

export const dynamic = 'force-dynamic';

/**
 * ProfileFavoritesPage — favorites tab in the personal account (2-column layout with promo sidebar).
 *
 * @returns Promise resolving to JSX of the favorites page.
 */
const ProfileFavoritesPage = async (): Promise<JSX.Element> => {
  const { pages } = await getBlogBanners();
  const banners = (pages ?? []).map(blogBannerFromPage);

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
