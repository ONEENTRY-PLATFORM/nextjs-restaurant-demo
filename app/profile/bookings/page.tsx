import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import BookingsContent from '@/components/profile/BookingsContent';

export const dynamic = 'force-dynamic';

/**
 * ProfileBookingsPage — вкладка бронирований в личном кабинете (2-колоночный layout).
 * @returns {Promise<JSX.Element>} JSX страницы бронирований.
 */
const ProfileBookingsPage = async (): Promise<JSX.Element> => {
  const banners = await getBlogBanners();
  return (
    <div className="md:flex md:justify-between md:gap-15">
      <div className="md:w-1/2">
        <BookingsContent />
      </div>
      <CartPromoSidebar banners={banners} />
    </div>
  );
};

export default ProfileBookingsPage;
