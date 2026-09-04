'use client';

import type { JSX } from 'react';

import { useTrackProductView } from '@/app/api/hooks/useTrackActivity';

/**
 * TrackProductView — records a `product_view` activity event for the current product.
 *
 * Render-less client island dropped into the (server-rendered) product page so the
 * view is logged once on mount. Feeds recently-viewed / personal recommendation Blocks.
 *
 * @param   {object} props           - Component props.
 * @param   {number} props.productId - Product id being viewed.
 * @returns `null` — renders nothing.
 */
const TrackProductView = ({ productId }: { productId: number }): JSX.Element | null => {
  useTrackProductView(productId);
  return null;
};

export default TrackProductView;
