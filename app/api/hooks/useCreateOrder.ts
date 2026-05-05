'use client';

import type { IOrderProductData, IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import { useState } from 'react';

import { getApi, isError } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { removeAllProducts, selectCartData } from '@/app/store/reducers/CartSlice';
import { removeOrder, selectAppliedCoupon, setLastOrderId } from '@/app/store/reducers/OrderSlice';
import type { IAppOrder } from '@/app/types/global';
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
 * Создаёт заказ через OneEntry `Orders.createOrder` и (если выбранный
 * способ оплаты — не наличные) открывает платёжную сессию через `Payments.createSession`.
 *
 * Хук управляется вызывающей стороной: он НЕ навигирует, НЕ переключает шаги
 * визарда, НЕ чистит локальное состояние самостоятельно. Возвращает объект-результат,
 * чтобы вызывающий код сам решил, что делать дальше (например, dispatch `setStep('success')`,
 * редирект на `paymentUrl` и т.п.). При успехе хук:
 *   - сохраняет новый id заказа через `setLastOrderId` (чтобы экран успеха
 *     смог его показать),
 *   - чистит локальную корзину + сбрасывает заказ в работе в Redux.
 * @returns {UseCreateOrderApi} Колбэк подтверждения + состояние loading / error.
 */
export const useCreateOrder = (): UseCreateOrderApi => {
  const dispatch = useAppDispatch();
  const order = useAppSelector(
    (state: { orderReducer: { order: IAppOrder } }) => state.orderReducer.order
  );
  // Визард никогда не диспатчит `addProducts` в order slice, поэтому позиции
  // заказа собираются напрямую из cart slice на этапе подтверждения.
  // `selectCartData` возвращает записи `{ id, quantity, selected }`.
  const cartProducts = useAppSelector(selectCartData) as CartEntry[];
  const appliedCoupon = useAppSelector(selectAppliedCoupon);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onConfirmOrder = async ({
    paymentAccountIdentifier,
  }: ConfirmOrderArgs): Promise<ConfirmOrderResult> => {
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

      // Собираем позиции из cart slice (в order slice они не заполняются на этапе выше).
      // Если есть хоть один selection-флаг — фильтруем только выбранные;
      // иначе включаем всё.
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

      // Пытаемся открыть платёжную сессию для безналичных способов. Сбой здесь
      // НЕ откатывает заказ — заказ уже существует в OneEntry; мы пробрасываем
      // это вызывающей стороне, чтобы UI мог показать "оплачено offline" или CTA
      // для повтора.
      let paymentUrl: string | undefined;
      if (createdPayment !== 'cash') {
        try {
          const session = await getApi().Payments.createSession(id, 'session');
          if (!isError(session)) {
            paymentUrl = (session as { paymentUrl?: string }).paymentUrl;
          }
        } catch {
          // глушим — заказ уже создан
        }
      }

      // Чистим локальную корзину + заказ в работе теперь, когда он сохранён.
      dispatch(removeAllProducts());
      dispatch(removeOrder());

      return paymentUrl ? { ok: true, orderId: id, paymentUrl } : { ok: true, orderId: id };
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
