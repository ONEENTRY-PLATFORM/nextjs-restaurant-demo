import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import OrdersList from '@/components/profile/OrdersList';

export const dynamic = 'force-dynamic';

/**
 * Вкладка заказов в личном кабинете.
 * @returns {Promise<JSX.Element>} JSX страницы заказов.
 */
const ProfileOrdersPage = async (): Promise<JSX.Element> => {
  const [promoBanners, dict] = await Promise.all([
    getBlogBanners(),
    getDictionary(),
  ]);
  return <OrdersList promoBanners={promoBanners} dict={dict} />;
};

export default ProfileOrdersPage;
