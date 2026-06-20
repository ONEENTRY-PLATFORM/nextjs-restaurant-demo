'use client';

import type { IOrderPreviewResponse } from 'oneentry/dist/orders/ordersInterfaces';
import { useContext, useEffect, useMemo, useState } from 'react';

import { getApi, isError } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';

import { derivePreviewTotals, type ServerOrderTotals } from './checkout.utils';

export type { ServerOrderTotals } from './checkout.utils';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

type UseOrderPreviewApi = {
  /** Server totals, or `null` for guests / empty cart / preview error (caller falls back to client math). */
  totals: ServerOrderTotals | null;
  isLoading: boolean;
};

/**
 * useOrderPreview — pre-checkout totals from `Orders.previewOrder` instead of client-only Redux math.
 *
 * Sends the same product list `createOrder` will (selected items + the delivery line) so server-side
 * discounts, bonuses and taxes are reflected before the order is created. Runs only for authenticated
 * users (the endpoint requires auth); returns `null` otherwise so the caller keeps its client-side
 * fallback. Re-previews whenever the selected products or coupon change.
 *
 * @param   {string} [couponCode] - Applied coupon code to include in the preview.
 * @returns `{ totals, isLoading }` — server totals (or `null`) plus loading state.
 */
export const useOrderPreview = (couponCode?: string): UseOrderPreviewApi => {
  const { isAuth } = useContext(AuthContext);
  const cartProducts = useAppSelector(selectCartData) as CartEntry[];

  const [totals, setTotals] = useState<ServerOrderTotals | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const products = useMemo(() => {
    const anySelectionFlag = cartProducts.some(p => typeof p.selected === 'boolean');
    const list = cartProducts
      .filter(p => (anySelectionFlag ? p.selected !== false : true))
      .map(p => ({ productId: p.id, quantity: p.quantity ?? 1 }));
    if (list.length > 0 && !list.some(p => p.productId === DELIVERY_PRODUCT_ID)) {
      list.push({ productId: DELIVERY_PRODUCT_ID, quantity: 1 });
    }
    return list;
  }, [cartProducts]);

  // Stable key so the preview only re-runs when product/coupon content actually changes.
  const key = useMemo(
    () => JSON.stringify({ products, couponCode: couponCode ?? '' }),
    [products, couponCode]
  );

  useEffect(() => {
    if (!isAuth || products.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotals(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const res = await getApi().Orders.previewOrder({
        products,
        ...(couponCode ? { couponCode } : {}),
      });
      if (cancelled) return;
      if (isError(res)) {
        setTotals(null);
      } else {
        setTotals(derivePreviewTotals(res as IOrderPreviewResponse, DELIVERY_PRODUCT_ID));
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // `key` encodes products + couponCode; depending on it avoids re-running on identical content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, key]);

  return { totals, isLoading };
};
