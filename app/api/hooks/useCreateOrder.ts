/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { IOrderProductData } from 'oneentry/dist/orders/ordersInterfaces';
import { useState } from 'react';

import { api, isError } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  removeAllProducts,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import { removeOrder, setLastOrderId } from '@/app/store/reducers/OrderSlice';
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
 * Creates an order via OneEntry `Orders.createOrder` and (when the chosen
 * payment method is non-cash) opens a payment session via `Payments.createSession`.
 *
 * The hook is caller-driven: it does NOT navigate, does NOT toggle wizard
 * steps, does NOT clear local state on its own. It returns a result object
 * so the caller can decide what to do next (e.g. dispatch `setStep('success')`,
 * redirect to `paymentUrl`, etc.). On success it does:
 *   - persist the new order id via `setLastOrderId` (so the success screen
 *     can show it),
 *   - clear the local cart + reset the in-progress order in Redux.
 * @returns {UseCreateOrderApi} Confirm callback + loading / error state.
 */
export const useCreateOrder = (): UseCreateOrderApi => {
  const dispatch = useAppDispatch();
  const order = useAppSelector(
    (state: { orderReducer: { order: any } }) => state.orderReducer.order,
  );
  // The wizard never dispatches `addProducts` to the order slice, so we
  // collect the order line items straight from the cart slice at confirm
  // time. `selectCartData` returns `{ id, quantity, selected }` records.
  const cartProducts = useAppSelector(selectCartData) as CartEntry[];

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
        .filter((element: { marker: string }) => element.marker !== 'time')
        .map((data: { marker: string; type: string; value: any }) => ({
          marker: data.marker,
          type: data.type,
          value: data.value,
        }));

      // Build line items from the cart slice (the order slice never gets
      // them populated upstream). Filter to selected entries when any
      // selection flag is present; otherwise include everything.
      const anySelectionFlag = cartProducts.some(
        (p) => typeof p.selected === 'boolean',
      );
      const orderProducts: IOrderProductData[] = cartProducts
        .filter((p) => (anySelectionFlag ? p.selected !== false : true))
        .map((p) => ({
          productId: p.id,
          quantity: p.quantity ?? 1,
        }));

      if (orderProducts.length === 0) {
        const message = 'Cart is empty';
        setError(message);
        return { ok: false, error: message };
      }

      const created = await api.Orders.createOrder('delivery_order', {
        formData: orderFormData,
        products: orderProducts,
        paymentAccountIdentifier,
        formIdentifier: order.formIdentifier,
      });

      if (isError(created)) {
        const message =
          (created as { message?: string }).message || 'Order creation failed';
        setError(message);
        return { ok: false, error: message };
      }

      const { id, paymentAccountIdentifier: createdPayment } = created as {
        id: number;
        paymentAccountIdentifier: string;
      };

      dispatch(setLastOrderId(id));

      // Try to open a payment session for non-cash methods. Failure here
      // does NOT roll the order back — the order exists in OneEntry; we
      // surface it to the caller so the UI can show "paid offline" or a
      // retry CTA.
      let paymentUrl: string | undefined;
      if (createdPayment !== 'cash') {
        try {
          const session = await api.Payments.createSession(id, 'session');
          if (!isError(session)) {
            paymentUrl = (session as { paymentUrl?: string }).paymentUrl;
          }
        } catch {
          // swallow — order is already created
        }
      }

      // Clear local cart + the in-progress order now that it's persisted.
      dispatch(removeAllProducts());
      dispatch(removeOrder());

      return paymentUrl
        ? { ok: true, orderId: id, paymentUrl }
        : { ok: true, orderId: id };
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
