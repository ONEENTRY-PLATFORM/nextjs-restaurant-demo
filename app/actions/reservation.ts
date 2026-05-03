'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

import { getApi, isError } from '@/app/api';

/**
 * Payload бронирования, отправляемый из клиентской формы.
 * Каждый элемент соответствует `marker`/`type` поля, определённого в OneEntry
 * Forms admin для маркера `booking_order`.
 */
export type ReservationPayload = {
  formData: FormDataType[];
};

const ORDER_STORAGE_MARKER = 'booking_order';

/**
 * Отправляет бронирование столика через OneEntry Orders API.
 *
 * `booking_order` в OneEntry — форма типа `order`, поэтому идёт через
 * `Orders.createOrder` (а не `FormData.postFormsData`, который возвращает
 * "Form has incorrect type: order"). У бронирования нет товаров и оплаты:
 * `products: []`, `paymentAccountIdentifier` — заглушка `cash` (любой
 * payment-account, привязанный к storage `booking_order`).
 * @param   {ReservationPayload}                                   payload - Поля бронирования, подготовленные на клиенте.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}       Результат серверного действия.
 */
export async function submitReservation(
  payload: ReservationPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const created = await getApi().Orders.createOrder(ORDER_STORAGE_MARKER, {
      formIdentifier: ORDER_STORAGE_MARKER,
      paymentAccountIdentifier: 'cash',
      // FormDataType из FormsData SDK структурно совместим с IOrdersFormData
      // (`{ marker, type, value }`), но TS-определения SDK представляют их
      // отдельными типами; кастуем, чтобы не дублировать структуру.
      formData: payload.formData as unknown as IOrdersFormData[],
      products: [],
    });

    if (isError(created)) {
      return {
        ok: false,
        message:
          (created as { message?: string }).message ||
          'Failed to submit reservation',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
