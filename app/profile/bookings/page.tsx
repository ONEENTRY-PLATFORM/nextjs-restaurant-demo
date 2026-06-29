import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import BookingsContent from '@/components/profile/bookings/BookingsContent';

export const dynamic = 'force-dynamic';

/**
 * ProfileBookingsPage — bookings tab in the personal account (2-column layout with promo sidebar).
 *
 * @returns Promise resolving to JSX of the bookings page.
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
