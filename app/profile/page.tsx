import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * Страница персональных данных профиля — 2-колоночный layout по образцу
 * корзины (`pk_cart.html`) и `/profile/favorites`: слева секции профиля
 * (My Profile + Address — те же, что в drawer-попапе), справа промо-баннеры
 * из CMS `blog`. На мобиле колонки стакаются — баннеры скрыты
 * (`md:flex` в сайдбаре), секции занимают всю ширину.
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
