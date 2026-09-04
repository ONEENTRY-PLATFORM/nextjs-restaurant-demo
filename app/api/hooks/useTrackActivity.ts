'use client';

import type { ITrackActivity } from 'oneentry/types';
import { useEffect } from 'react';

import { getApi } from '@/app/api/api/api';

/**
 * trackActivity — fire-and-forget user/guest activity event.
 *
 * @param   {ITrackActivity} body - Activity event (`type` + optional `productId`/`query`/`meta`).
 * @returns Nothing — the call is intentionally not awaited.
 */
export const trackActivity = (body: ITrackActivity): void => {
  try {
    void Promise.resolve(getApi().UserActivity.trackUserActivity(body)).catch(() => {});
  } catch {
    // never throw from analytics
  }
};

/**
 * useTrackProductView — records a single `product_view` event when the id is ready.
 *
 * @param   {number | undefined} productId - Product id to record a view for (no-op when undefined).
 * @returns Nothing.
 */
export const useTrackProductView = (productId: number | undefined): void => {
  useEffect(() => {
    if (!productId) {
      return;
    }
    trackActivity({ type: 'product_view', productId });
  }, [productId]);
};
