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
  totals: ServerOrderTotals | null;
  isLoading: boolean;
};

/**
 * useOrderPreview — pre-checkout totals from `Orders.previewOrder` instead of client-only Redux math.
 *
 * @param   {string} [couponCode]  - Applied coupon code to include in the preview.
 * @param   {number} [bonusAmount] - Bonus points the user opted to spend (server caps it to the amount due).
 * @returns `{ totals, isLoading }` — server totals (or `null`) plus loading state.
 */
export const useOrderPreview = (couponCode?: string, bonusAmount?: number): UseOrderPreviewApi => {
  const { isAuth } = useContext(AuthContext);
  const cartProducts = useAppSelector(selectCartData) as CartEntry[];

  /**
   * Totals are stored together with the request signature they answer, so
   * "still loading" is derived by comparing keys instead of being written into
   * state synchronously from the effect body (which would cascade renders).
   */
  const [result, setResult] = useState<{
    key: string;
    totals: ServerOrderTotals | null;
  }>({ key: '', totals: null });

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

  // Stable key so the preview only re-runs when product/coupon/bonus content actually changes.
  const key = useMemo(
    () => JSON.stringify({ products, couponCode: couponCode ?? '', bonusAmount: bonusAmount ?? 0 }),
    [products, couponCode, bonusAmount]
  );

  // Signing out or emptying the cart means "no totals" — derived at return
  // time below, so the effect has nothing to reset here.
  const hasPreview = isAuth && products.length > 0;

  useEffect(() => {
    if (!hasPreview) {
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getApi().Orders.previewOrder({
        products,
        ...(couponCode ? { couponCode } : {}),
        ...(bonusAmount && bonusAmount > 0 ? { bonusAmount } : {}),
      });
      if (cancelled) return;
      // The only state write of the hook, and it happens after `await`.
      setResult({
        key,
        totals: isError(res)
          ? null
          : derivePreviewTotals(res as IOrderPreviewResponse, DELIVERY_PRODUCT_ID),
      });
    })();
    return () => {
      cancelled = true;
    };
    // `key` is the content signature of products/coupon/bonus — object identities would re-run the preview every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPreview, key]);

  /**
   * Both outputs are derived. Without an authenticated user or a non-empty
   * cart there are no server totals at all; otherwise the preview is "loading"
   * until the stored result carries the signature of the current request, so
   * totals from a previous cart are never shown for the current one.
   */
  const isCurrent = result.key === key;
  return {
    totals: hasPreview && isCurrent ? result.totals : null,
    isLoading: hasPreview && !isCurrent,
  };
};
