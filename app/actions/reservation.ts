'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

import { getApi, isError } from '@/app/api';

/**
 * Reservation payload sent from the client form.
 * Each item corresponds to the `marker`/`type` of a field defined in OneEntry
 * Forms admin for the `booking_order` marker.
 */
export type ReservationPayload = {
  formData: FormDataType[];
};

const ORDER_STORAGE_MARKER = 'booking_order';

/**
 * Submits a table reservation via the OneEntry Orders API.
 *
 * `booking_order` in OneEntry is a form of type `order`, so it goes through
 * `Orders.createOrder`.
 *
 * @param   {ReservationPayload}                                     payload - Reservation fields prepared on the client.
 * @returns Result of the server action.
 */
export async function submitReservation(
  payload: ReservationPayload
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const created = await getApi().Orders.createOrder(ORDER_STORAGE_MARKER, {
      formIdentifier: ORDER_STORAGE_MARKER,
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
