import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * ProfilePage — personal profile data page (2-column layout with promo sidebar).
 *
 * @returns {Promise<JSX.Element>} Promise resolving to JSX of the personal data page.
 */
const ProfilePage = async (): Promise<JSX.Element> => {
  const banners = await getBlogBanners();
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
