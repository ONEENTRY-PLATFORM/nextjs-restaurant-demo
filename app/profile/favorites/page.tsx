import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import CartPromoSidebar from '@/components/cart/CartPromoSidebar';
import FavoritesGrid from '@/components/profile/FavoritesGrid';

export const dynamic = 'force-dynamic';

/**
 * Вкладка избранного в личном кабинете — порт `static-html/pk_favorites.html`
 * в 2-колоночный layout по образцу корзины (`pk_cart.html`): слева список
 * избранного (одна колонка карточек), справа промо-баннеры из CMS `blog`
 * (тот же `CartPromoSidebar`, что и на странице корзины). На мобиле колонки
 * стакаются — баннеры скрыты (`md:flex` в сайдбаре), карточки занимают всю
 * ширину.
 *
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
