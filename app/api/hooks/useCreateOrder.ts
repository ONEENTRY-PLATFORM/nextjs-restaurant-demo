'use client';

import type { IOrderProductData, IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import { useState } from 'react';

import { getApi, isError } from '@/app/api';
import { useAppDispatch, useAppStore } from '@/app/store/hooks';
import { removeAllProducts, selectCartData } from '@/app/store/reducers/CartSlice';
import { removeOrder, selectAppliedCoupon, setLastOrderId } from '@/app/store/reducers/OrderSlice';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import { handleApiError } from '@/app/utils/errorHandler';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

export type ConfirmOrderResult =
  | { ok: true; orderId: number; paymentUrl?: string }
  | { ok: false; error: string };

type ConfirmOrderArgs = {
  paymentAccountIdentifier: string;
};

type UseCreateOrderApi = {
  onConfirmOrder: (args: ConfirmOrderArgs) => Promise<ConfirmOrderResult>;
  isLoading: boolean;
  error: string;
};

/**
 * useCreateOrder — создаёт заказ через `Orders.createOrder` и при не-cash оплате открывает payment-сессию.
 *
 * Не навигирует и не чистит state сам — возвращает результат, чтобы вызывающий решил, что делать дальше.
 * При успехе сохраняет id заказа через `setLastOrderId`, чистит корзину и сбрасывает draft заказа в Redux.
 * @returns {UseCreateOrderApi} Колбэк подтверждения + loading/error.
 */
export const useCreateOrder = (): UseCreateOrderApi => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onConfirmOrder = async ({
    paymentAccountIdentifier,
  }: ConfirmOrderArgs): Promise<ConfirmOrderResult> => {
    const state = store.getState();
    const order = state.orderReducer.order;
    const cartProducts = selectCartData(state) as CartEntry[];
    const appliedCoupon = selectAppliedCoupon(state);

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

      // К каждому заказу добавляем услугу-доставку (productId 33).
      if (!orderProducts.some(p => p.productId === DELIVERY_PRODUCT_ID)) {
        orderProducts.push({ productId: DELIVERY_PRODUCT_ID, quantity: 1 });
      }

      const created = await getApi().Orders.createOrder('delivery_order', {
        formData: orderFormData,
        products: orderProducts,
        paymentAccountIdentifier,
        formIdentifier: order.formIdentifier,
        ...(appliedCoupon?.code ? { couponCode: appliedCoupon.code } : {}),
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

      // Чистим локальную корзину + draft заказа ТОЛЬКО на успешных ветках (cash или удачный
      // Stripe paymentUrl). При сбое payment-сессии оставляем — заказ в OneEntry уже создан,
      // повторная попытка без потерянной корзины — меньшее зло, чем дубль заказа.
      const clearCheckoutState = (): void => {
        dispatch(removeAllProducts());
        dispatch(removeOrder());
      };

      // Cash — оплата офлайн, paymentUrl не нужен.
      if (createdPayment === 'cash') {
        clearCheckoutState();
        return { ok: true, orderId: id };
      }

      // Для остальных способов (Stripe и пр.) открываем hosted checkout. Ошибки НЕ глушим:
      // при IError / paymentUrl=null возвращаем ok:false — иначе wizard молча уходит на success
      // без редиректа на Stripe (см. PaymentsApi.createSession и orders.md).
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
        // null = несконфигурированный аккаунт или async-провайдер (PayPal, требует
        // polling getSessionByOrderId — пока не поддерживаем).
        return {
          ok: false,
          error: `Order #${id} created, but payment provider returned no checkout URL.`,
        };
      }

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
