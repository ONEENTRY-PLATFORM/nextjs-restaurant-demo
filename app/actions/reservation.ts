'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, isError } from '@/app/api';

/**
 * Payload бронирования, отправляемый из клиентской формы.
 * Каждый элемент соответствует `marker`/`type` поля, определённого в OneEntry
 * Forms admin для маркера `reservation`.
 */
export type ReservationPayload = {
  formData: FormDataType[];
  formModuleConfigId?: number;
  moduleEntityIdentifier?: string;
};

/**
 * Отправляет бронирование столика через OneEntry FormsData API.
 *
 * Сначала получает форму `reservation`, чтобы извлечь метаданные `moduleFormConfigs`,
 * затем отправляет данные формы. Возвращает `{ ok: true }` при успехе или `{ ok: false, message }` при неудаче.
 * @param   {ReservationPayload}                                   payload - Поля бронирования, подготовленные на клиенте.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}       Результат серверного действия.
 */
export async function submitReservation(
  payload: ReservationPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const api = getApi();
    const form = await api.Forms.getFormByMarker('booking_order');
    if (isError(form)) {
      return {
        ok: false,
        message:
          (form as { message?: string }).message ||
          'Reservation form is not configured in CMS',
      };
    }

    const formMeta = form as unknown as {
      moduleFormConfigs?: Array<{
        id?: number;
        entityIdentifiers?: Array<{ id?: string }>;
      }>;
    };
    const formModuleConfigId =
      payload.formModuleConfigId ?? formMeta.moduleFormConfigs?.[0]?.id ?? 0;
    const moduleEntityIdentifier =
      payload.moduleEntityIdentifier ??
      formMeta.moduleFormConfigs?.[0]?.entityIdentifiers?.[0]?.id ??
      '';

    const res = await api.FormData.postFormsData({
      formIdentifier: 'booking_order',
      formData: payload.formData,
      formModuleConfigId,
      moduleEntityIdentifier,
      replayTo: null,
      status: '',
    });

    if (isError(res)) {
      return {
        ok: false,
        message:
          (res as { message?: string }).message ||
          'Failed to submit reservation',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
