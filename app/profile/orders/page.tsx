import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import OrdersList from '@/components/profile/OrdersList';

export const dynamic = 'force-dynamic';

/**
 * Orders tab of the profile dashboard.
 * @returns {Promise<JSX.Element>} Orders page JSX.
 */
const ProfileOrdersPage = async (): Promise<JSX.Element> => {
  const promoBanners = await getBlogBanners();
  return <OrdersList promoBanners={promoBanners} />;
};

export default ProfileOrdersPage;
