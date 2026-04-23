import type { JSX } from 'react';

import OrdersList from '@/components/profile/OrdersList';

export const dynamic = 'force-dynamic';

/**
 * Orders tab of the profile dashboard.
 * @returns {JSX.Element} Orders page JSX.
 */
const ProfileOrdersPage = (): JSX.Element => {
  return <OrdersList />;
};

export default ProfileOrdersPage;
