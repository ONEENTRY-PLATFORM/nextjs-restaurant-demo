'use client';

import type { IAccountsEntity, IOrderProductData, IOrdersFormData } from 'oneentry/types';
import { useState } from 'react';

import { getApi, isError } from '@/app/api/api/api';
import { trackActivity } from '@/app/api/hooks/useTrackActivity';
import { useAppDispatch, useAppStore } from '@/app/store/hooks';
import { removeAllProducts, selectCartData } from '@/app/store/reducers/CartSlice';
import {
  removeOrder,
  selectAppliedCoupon,
  selectBonusAmount,
  setLastOrderId,
} from '@/app/store/reducers/OrderSlice';
import { saveCheckoutCartSnapshot } from '@/app/utils/checkoutCartSnapshot';
import { DELIVERY_PRODUCT_ID, FORMS } from '@/app/utils/constants';
import { handleApiError } from '@/app/utils/errorHandler';

import { isOnlinePaymentAccount } from './paymentAccountKind';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

export type ConfirmOrderResult =
  { ok: true; orderId: number; paymentUrl?: string } | { ok: false; error: string };

type ConfirmOrderArgs = {
  paymentAccountIdentifier: string;
  /** SDK `type` of the selected account; drives online-vs-offline routing (see {@link isOnlinePaymentAccount}). */
  paymentAccountType?: IAccountsEntity['type'] | undefined;
};

type UseCreateOrderApi = {
  onConfirmOrder: (args: ConfirmOrderArgs) => Promise<ConfirmOrderResult>;
  isLoading: boolean;
  error: string;
};

/**
 * useCreateOrder — creates an order via `Orders.createOrder` and opens a payment session for non-cash methods.
 *
 * @returns `{ onConfirmOrder, isLoading, error }` — confirm callback plus loading/error state.
 */
export const useCreateOrder = (): UseCreateOrderApi => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onConfirmOrder = async ({
    paymentAccountIdentifier,
    paymentAccountType,
  }: ConfirmOrderArgs): Promise<ConfirmOrderResult> => {
    const state = store.getState();
    const order = state.orderReducer.order;
    const cartProducts = selectCartData(state) as CartEntry[];
    const appliedCoupon = selectAppliedCoupon(state);
    const bonusAmount = selectBonusAmount(state);

    if (!order?.formIdentifier) {
      const message = 'Order form is not initialised';
      setError(message);
      return { ok: false, error: message };
    }
    if (!paymentAccountIdentifier) {
      const message = 'Please select a payment method';
      setError(message);
      return { ok: false, error: message };
    }

    setIsLoading(true);
    setError('');

    try {
      const orderFormData = (order.formData ?? [])
        .slice()
        .filter((element: IOrdersFormData) => element.marker !== 'time')
        .map((data: IOrdersFormData) => ({
          marker: data.marker,
          type: data.type,
          value: data.value,
        }));

      const anySelectionFlag = cartProducts.some(p => typeof p.selected === 'boolean');
      const orderProducts: IOrderProductData[] = cartProducts
        .filter(p => (anySelectionFlag ? p.selected !== false : true))
        .map(p => ({
          productId: p.id,
          quantity: p.quantity ?? 1,
        }));

      if (orderProducts.length === 0) {
        const message = 'Cart is empty';
        setError(message);
        return { ok: false, error: message };
      }

      if (!orderProducts.some(p => p.productId === DELIVERY_PRODUCT_ID)) {
        orderProducts.push({ productId: DELIVERY_PRODUCT_ID, quantity: 1 });
      }

      const storageMarker = order.storageMarker || FORMS.deliveryOrder;
      const created = await getApi().Orders.createOrder(storageMarker, {
        formData: orderFormData,
        products: orderProducts,
        paymentAccountIdentifier,
        formIdentifier: order.formIdentifier || FORMS.deliveryOrder,
        ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
        ...(bonusAmount && bonusAmount > 0 ? { bonusAmount } : {}),
      });

      if (isError(created)) {
        const message = (created as { message?: string }).message || 'Order creation failed';
        setError(message);
        return { ok: false, error: message };
      }

      const { id, paymentAccountIdentifier: createdPayment } = created as {
        id: number;
        paymentAccountIdentifier: string;
      };

      dispatch(setLastOrderId(id));

      const clearCheckoutState = (): void => {
        orderProducts
          .filter(p => p.productId !== DELIVERY_PRODUCT_ID)
          .forEach(p =>
            trackActivity({
              type: 'product_purchase',
              productId: p.productId,
              meta: { orderId: id, qty: p.quantity },
            })
          );
        dispatch(removeAllProducts());
        dispatch(removeOrder());
      };

      // Offline account (cash / pay-on-site) — settled without a hosted checkout, no paymentUrl needed.
      const isOnline = isOnlinePaymentAccount({
        type: paymentAccountType,
        identifier: createdPayment ?? paymentAccountIdentifier,
      });
      if (!isOnline) {
        clearCheckoutState();
        return { ok: true, orderId: id };
      }

      let session;
      try {
        session = await getApi().Payments.createSession(id, 'session');
      } catch (e) {
        const apiError = handleApiError('createSession', e);
        return {
          ok: false,
          error: `Order #${id} created, but payment session failed: ${apiError.message}`,
        };
      }

      if (isError(session)) {
        const sErr = session as { message?: string; statusCode?: number };
        const detail = sErr.message || `HTTP ${sErr.statusCode ?? '?'}`;
        return {
          ok: false,
          error: `Order #${id} created, but payment session failed: ${detail}`,
        };
      }

      const paymentUrl = (session as { paymentUrl?: string | null }).paymentUrl ?? undefined;
      if (!paymentUrl) {
        // null = unconfigured account or an async provider (PayPal requires
        // polling getSessionByOrderId — not supported yet).
        return {
          ok: false,
          error: `Order #${id} created, but payment provider returned no checkout URL.`,
        };
      }

      // The cart is wiped before leaving for the hosted checkout; snapshot it so
      // /payment/cancel can put the items back if the user aborts the payment.
      saveCheckoutCartSnapshot(
        cartProducts.map(p => ({
          id: p.id,
          quantity: p.quantity ?? 1,
          selected: p.selected !== false,
        })),
        id
      );
      clearCheckoutState();
      return { ok: true, orderId: id, paymentUrl };
    } catch (e) {
      const apiError = handleApiError('onConfirmOrder', e);
      setError(apiError.message);
      return { ok: false, error: apiError.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { onConfirmOrder, isLoading, error };
};
