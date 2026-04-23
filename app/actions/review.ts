'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, isError } from '@/app/api';

/**
 * Review submission payload collected from the client.
 * @property {number} rating    - Star rating 1–5.
 * @property {string} text      - Review body.
 * @property {string} author    - Author display name.
 * @property {number} productId - ID of the reviewed product.
 */
export type ReviewPayload = {
  rating: number;
  text: string;
  author: string;
  productId: number;
};

/**
 * Submit a product review to OneEntry FormsData API (`review` form marker).
 * @param   {ReviewPayload}                                        payload - Review data.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}        Result.
 */
export async function submitReview(
  payload: ReviewPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const api = getApi();
    const form = await api.Forms.getFormByMarker('review');
    if (isError(form)) {
      return {
        ok: false,
        message:
          (form as { message?: string }).message ||
          'Review form is not configured in CMS',
      };
    }

    const formMeta = form as unknown as {
      moduleFormConfigs?: Array<{
        id?: number;
        entityIdentifiers?: Array<{ id?: string }>;
      }>;
    };
    const formModuleConfigId = formMeta.moduleFormConfigs?.[0]?.id ?? 0;
    const moduleEntityIdentifier =
      formMeta.moduleFormConfigs?.[0]?.entityIdentifiers?.[0]?.id ?? '';

    const formData: FormDataType[] = [
      {
        marker: 'review_rating',
        type: 'integer',
        value: payload.rating,
      } as unknown as FormDataType,
      {
        marker: 'review_text',
        type: 'text',
        value: [{ htmlValue: payload.text, plainValue: payload.text }],
      } as unknown as FormDataType,
      {
        marker: 'review_author',
        type: 'string',
        value: payload.author,
      } as unknown as FormDataType,
      {
        marker: 'review_product_id',
        type: 'integer',
        value: payload.productId,
      } as unknown as FormDataType,
    ];

    const res = await api.FormData.postFormsData({
      formIdentifier: 'review',
      formData,
      formModuleConfigId,
      moduleEntityIdentifier,
      replayTo: null,
      status: '',
    });

    if (isError(res)) {
      return {
        ok: false,
        message:
          (res as { message?: string }).message || 'Failed to submit review',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
