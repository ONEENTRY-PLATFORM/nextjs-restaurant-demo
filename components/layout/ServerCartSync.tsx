'use client';

import { useServerCartSync } from '@/app/api/hooks/useServerCartSync';

/**
 * ServerCartSync — mounts {@link useServerCartSync} once to mirror the Redux cart/favorites to the
 * OneEntry server cart/wishlist (and merge the guest cart on login). Renders nothing.
 *
 * @returns `null`.
 */
const ServerCartSync = (): null => {
  useServerCartSync();
  return null;
};

export default ServerCartSync;
