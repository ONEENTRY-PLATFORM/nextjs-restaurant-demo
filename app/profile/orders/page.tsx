import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api';
import OrdersList from '@/components/profile/orders/OrdersList';

export const dynamic = 'force-dynamic';

/**
 * ProfileOrdersPage — orders tab in the personal account.
 *
 * @returns Promise resolving to JSX of the orders page (forwards `promoBanners` from `getBlogBanners()`).
 */
const ProfileOrdersPage = async (): Promise<JSX.Element> => {
  const promoBanners = await getBlogBanners();
  return <OrdersList promoBanners={promoBanners} />;
};

export default ProfileOrdersPage;
