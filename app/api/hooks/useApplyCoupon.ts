'use client';

import type { IOrderPreviewResponse } from 'oneentry/dist/orders/ordersInterfaces';
import { useState } from 'react';

import { getApi, isError } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import {
  clearAppliedCoupon,
  setAppliedCoupon,
} from '@/app/store/reducers/OrderSlice';
import { handleApiError } from '@/app/utils/errorHandler';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

export type ApplyCouponResult =
  | { ok: true; discount: number }
  | { ok: false; error: string };

type UseApplyCouponApi = {
  applyCoupon: (code: string) => Promise<ApplyCouponResult>;
  removeCoupon: () => void;
  isLoading: boolean;
  error: string;
};

/**
 * Применяет промокод к корзине через `Orders.previewOrder`.
 *
 * Сервер сам валидирует код и считает реальную скидку с учётом всех условий
 * (`MIN_CART_AMOUNT`, `applicability`, `maxAmount`, ...). При успехе сохраняет
 * `{ code, totalSum, totalSumWithDiscount }` в `OrderSlice.appliedCoupon`,
 * откуда `StepOrder` берёт строку «Discount» и пересчитанный total, а
 * `useCreateOrder` пробрасывает `couponCode` в `Orders.createOrder`.
 * @returns {UseApplyCouponApi} apply/remove + loading/error.
 */
export const useApplyCoupon = (): UseApplyCouponApi => {
  const dispatch = useAppDispatch();
  const cartProducts = useAppSelector(selectCartData) as CartEntry[];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const applyCoupon = async (code: string): Promise<ApplyCouponResult> => {
    const trimmed = code.trim();
    if (!trimmed) {
      const message = 'Enter a promo code';
      setError(message);
      return { ok: false, error: message };
    }

    const anySelectionFlag = cartProducts.some(
      (p) => typeof p.selected === 'boolean',
    );
    const products = cartProducts
      .filter((p) => (anySelectionFlag ? p.selected !== false : true))
      .map((p) => ({ productId: p.id, quantity: p.quantity ?? 1 }));

    if (products.length === 0) {
      const message = 'Cart is empty';
      setError(message);
      return { ok: false, error: message };
    }

    setIsLoading(true);
    setError('');

    try {
      const preview = await getApi().Orders.previewOrder({
        products,
        couponCode: trimmed,
      });

      if (isError(preview)) {
        const message =
          (preview as { message?: string }).message || 'Invalid coupon code';
        setError(message);
        dispatch(clearAppliedCoupon());
        return { ok: false, error: message };
      }

      const { totalSum, totalSumWithDiscount, currency } =
        preview as IOrderPreviewResponse;

      // Сервер вернул успех, но скидка нулевая — код существует, но не
      // применился к этой корзине (условия не выполнились).
      if (totalSumWithDiscount >= totalSum) {
        const message = 'Coupon does not apply to this cart';
        setError(message);
        dispatch(clearAppliedCoupon());
        return { ok: false, error: message };
      }

      dispatch(
        setAppliedCoupon({
          code: trimmed,
          totalSum,
          totalSumWithDiscount,
          currency,
        }),
      );
      return { ok: true, discount: totalSum - totalSumWithDiscount };
    } catch (e) {
      const apiError = handleApiError('useApplyCoupon', e);
      setError(apiError.message);
      dispatch(clearAppliedCoupon());
      return { ok: false, error: apiError.message };
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = (): void => {
    setError('');
    dispatch(clearAppliedCoupon());
  };

  return { applyCoupon, removeCoupon, isLoading, error };
};
