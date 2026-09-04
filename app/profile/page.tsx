import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api/server/pages/getBlogBanners';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import { blogBannerFromPage } from '@/components/promo/blogBanner';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * ProfilePage — personal profile data page (2-column layout with promo sidebar).
 *
 * @returns Promise resolving to JSX of the personal data page.
 */
const ProfilePage = async (): Promise<JSX.Element> => {
  const { pages } = await getBlogBanners();
  const banners = (pages ?? []).map(blogBannerFromPage);
  return (
    <div className="md:flex md:justify-between md:gap-15">
      <div className="md:w-1/2">
        <ProfilePageClient />
      </div>
      <CartPromoSidebar banners={banners} />
    </div>
  );
};

export default ProfilePage;
