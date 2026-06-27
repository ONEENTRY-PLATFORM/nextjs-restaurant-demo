'use client';

import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import { useState } from 'react';

import { getApi, isError } from '@/app/api';
import { BOOKING_PRODUCT_ID, FORMS } from '@/app/utils/constants';

type CreateReservationArgs = {
  paymentAccountIdentifier: string;
  formData: IOrdersFormData[];
};

type UpdateReservationArgs = {
  orderId: number;
  formIdentifier: string;
  paymentAccountIdentifier: string;
  formData: IOrdersFormData[];
};

type CreateReservationResult =
  | { ok: true; orderId: number; paymentUrl?: string }
  | { ok: false; error: string };

type UpdateReservationResult = { ok: true } | { ok: false; error: string };

type UseSubmitReservationApi = {
  createReservation: (args: CreateReservationArgs) => Promise<CreateReservationResult>;
  updateReservation: (args: UpdateReservationArgs) => Promise<UpdateReservationResult>;
  isLoading: boolean;
  error: string;
};

/**
 * useSubmitReservation — creates or updates a `booking_order` via the Orders API, opening a payment session for online methods.
 *
 * @returns `{ createReservation, updateReservation, isLoading, error }` — submit callbacks plus shared loading/error state.
 */
export const useSubmitReservation = (): UseSubmitReservationApi => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const createReservation = async ({
    paymentAccountIdentifier,
    formData,
  }: CreateReservationArgs): Promise<CreateReservationResult> => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getApi().Orders.createOrder(FORMS.bookingOrder, {
        formIdentifier: FORMS.bookingOrder,
        paymentAccountIdentifier,
        formData,
        products: [{ productId: BOOKING_PRODUCT_ID, quantity: 1 }],
      });
      if (isError(res)) {
        const message = (res as { message?: string }).message ?? 'Failed to submit reservation';
        setError(message);
        return { ok: false, error: message };
      }
      const { id } = res as { id: number };

      // Online -> open a payment session and redirect. Cash accounts return paymentUrl=null
      // and fall through to the success branch shown inside the popup.
      if (paymentAccountIdentifier !== 'cash') {
        try {
          const session = await getApi().Payments.createSession(id, 'session');
          if (!isError(session)) {
            const url = (session as { paymentUrl?: string | null }).paymentUrl;
            if (url) {
              return { ok: true, orderId: id, paymentUrl: url };
            }
          }
        } catch {
          // Swallow - the order is already created, we still proceed to success.
        }
      }
      return { ok: true, orderId: id };
    } catch (err) {
      const message = (err as Error).message || 'Failed to submit reservation';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservation = async ({
    orderId,
    formIdentifier,
    paymentAccountIdentifier,
    formData,
  }: UpdateReservationArgs): Promise<UpdateReservationResult> => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getApi().Orders.updateOrderByMarkerAndId(FORMS.bookingOrder, orderId, {
        formIdentifier,
        paymentAccountIdentifier,
        formData,
        products: [{ productId: BOOKING_PRODUCT_ID, quantity: 1 }],
      });
      if (isError(res)) {
        const message = (res as { message?: string }).message ?? 'Failed to update reservation';
        setError(message);
        return { ok: false, error: message };
      }
      return { ok: true };
    } catch (err) {
      const message = (err as Error).message || 'Failed to update reservation';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { createReservation, updateReservation, isLoading, error };
};
