'use client';

import type { IAccountsEntity, IOrdersFormData } from 'oneentry/types';
import { useState } from 'react';

import { getApi, isError } from '@/app/api/api/api';
import { BOOKING_PRODUCT_ID, FORMS } from '@/app/utils/constants';

import { isOnlinePaymentAccount } from './paymentAccountKind';

type CreateReservationArgs = {
  paymentAccountIdentifier: string;
  /** SDK `type` of the selected account; drives online-vs-offline routing (see {@link isOnlinePaymentAccount}). */
  paymentAccountType?: IAccountsEntity['type'] | undefined;
  formData: IOrdersFormData[];
};

type UpdateReservationArgs = {
  orderId: number;
  formIdentifier: string;
  paymentAccountIdentifier: string;
  formData: IOrdersFormData[];
};

type CreateReservationResult =
  { ok: true; orderId: number; paymentUrl?: string } | { ok: false; error: string };

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
    paymentAccountType,
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

      // Offline account (cash / pay-on-site) — no hosted checkout, go straight to success.
      const isOnline = isOnlinePaymentAccount({
        type: paymentAccountType,
        identifier: paymentAccountIdentifier,
      });
      if (!isOnline) {
        return { ok: true, orderId: id };
      }

      // Online -> open a payment session and redirect to its URL.
      let session;
      try {
        session = await getApi().Payments.createSession(id, 'session');
      } catch (e) {
        const message = `Reservation #${id} created, but payment session failed: ${(e as Error).message}`;
        setError(message);
        return { ok: false, error: message };
      }
      if (isError(session)) {
        const sErr = session as { message?: string; statusCode?: number };
        const message = `Reservation #${id} created, but payment session failed: ${sErr.message || `HTTP ${sErr.statusCode ?? '?'}`}`;
        setError(message);
        return { ok: false, error: message };
      }
      const url = (session as { paymentUrl?: string | null }).paymentUrl;
      if (url) {
        return { ok: true, orderId: id, paymentUrl: url };
      }
      // paymentUrl null for an online account = unconfigured account or an async provider
      // (PayPal needs getSessionByOrderId polling — deferred). Do NOT show success on an unpaid order.
      const message = `Reservation #${id} created, but the payment provider returned no checkout URL.`;
      setError(message);
      return { ok: false, error: message };
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
