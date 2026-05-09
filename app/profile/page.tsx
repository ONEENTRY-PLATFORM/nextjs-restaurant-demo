import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * ProfilePage — страница персональных данных профиля (2-колоночный layout).
 * @returns {Promise<JSX.Element>} JSX страницы персональных данных.
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
