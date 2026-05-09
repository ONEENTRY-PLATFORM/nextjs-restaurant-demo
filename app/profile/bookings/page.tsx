import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import BookingsContent from '@/components/profile/BookingsContent';

export const dynamic = 'force-dynamic';

/**
 * Вкладка бронирований в личном кабинете на десктопе — 2-колоночный layout
 * по образцу `/profile/favorites` и `/profile/orders`: слева Active
 * reservation + Reservation History (тот же {@link BookingsContent}, что
 * на мобиле рендерится inline-экраном внутри `ProfilePopup`), справа
 * промо-баннеры из CMS `blog`. На мобиле колонки стакаются — баннеры
 * скрыты (`md:flex` в сайдбаре), но в реальной мобильной навигации
 * пользователь сюда не попадает: bookings там доступны как screen-swap
 * в `ProfilePopup`.
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
