'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

import { getApi, isError } from '@/app/api';
import { FORMS } from '@/app/utils/constants';

/** Reservation payload sent from the client form. */
export type ReservationPayload = {
  formData: FormDataType[];
};

/**
 * Submits a table reservation via the OneEntry Orders API.
 *
 * @param   {ReservationPayload}                                     payload - Reservation fields prepared on the client.
 * @returns Result of the server action.
 */
export async function submitReservation(
  payload: ReservationPayload
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const created = await getApi().Orders.createOrder(FORMS.bookingOrder, {
      formIdentifier: FORMS.bookingOrder,
      paymentAccountIdentifier: 'cash',
      formData: payload.formData as IOrdersFormData[],
      products: [],
    });

    if (isError(created)) {
      return {
        ok: false,
        message: (created as { message?: string }).message || 'Failed to submit reservation',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
