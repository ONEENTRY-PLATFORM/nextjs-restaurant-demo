'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, isError } from '@/app/api';

/**
 * Reservation payload sent from the client form.
 * Each entry matches the `marker`/`type` of a field defined in OneEntry
 * Forms admin for marker `reservation`.
 */
export type ReservationPayload = {
  formData: FormDataType[];
  formModuleConfigId?: number;
  moduleEntityIdentifier?: string;
};

/**
 * Submit a table reservation to OneEntry FormsData API.
 *
 * Fetches the `reservation` form first to grab `moduleFormConfigs` metadata,
 * then posts form data. Returns `{ ok: true }` on success or `{ ok: false, message }` on failure.
 * @param   {ReservationPayload}                                   payload - Reservation fields prepared on the client.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}       Server action result.
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
      formIdentifier: 'reservation',
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
