import type { JSX } from 'react';

import { getBlogBanners } from '@/app/api/server/pages/getBlogBanners';
import OrdersList from '@/components/profile/orders/OrdersList';
import { blogBannerFromPage } from '@/components/promo/blogBanner';

export const dynamic = 'force-dynamic';

/**
 * ProfileOrdersPage — orders tab in the personal account.
 *
 * @returns Promise resolving to JSX of the orders page (forwards `promoBanners` from `getBlogBanners()`).
 */
const ProfileOrdersPage = async (): Promise<JSX.Element> => {
  const { pages } = await getBlogBanners();
  const promoBanners = (pages ?? []).map(blogBannerFromPage);
  return <OrdersList promoBanners={promoBanners} />;
};

export default ProfileOrdersPage;
