'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, isError } from '@/app/api';
import type { FormAttribute } from '@/components/reviews/utils/transformFormData';
import {
  transformFormField,
  validateFormData,
} from '@/components/reviews/utils/transformFormData';

const FORM_MARKER = 'review_form';
const FORM_STATUS = 'approved';
const DEFAULT_MODULE_CONFIG_ID = 5;

/**
 * Markers expected on the `comment_to_product` form in OneEntry.
 * The UI only collects a star rating + free-text body; any other form
 * fields the admin adds (images, spam, etc.) are still posted via
 * {@link transformFormField}'s default branch and stay empty.
 */
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';

/**
 * Review submission payload collected from the client.
 * Author identity is resolved from the OneEntry auth session by the SDK
 * (the form is gated behind sign-in in the UI). The product association
 * is carried by `moduleEntityIdentifier`, not by a hidden form field.
 * @property {number} rating    - Star rating 1–5.
 * @property {string} text      - Review body.
 * @property {number} productId - ID of the reviewed product (becomes `moduleEntityIdentifier`).
 */
export type ReviewPayload = {
  rating: number;
  text: string;
  productId: number;
};

/**
 * Submit a product review to OneEntry FormsData (`review_form` marker).
 *
 * Mirrors the submission contract used in `oneentry-next-shop`:
 * - form fields are read dynamically from the form schema, sorted by `position`,
 *   and transformed per type via {@link transformFormField};
 * - `moduleEntityIdentifier` carries the product id so each review is scoped
 *   to its product without a hidden `productId` field on the form;
 * - `formModuleConfigId` is read from the form's `moduleFormConfigs[0].id`
 *   with a project-wide fallback;
 * - `status: 'approved'` matches the reference shop — flip in OneEntry if
 *   moderation should hold reviews before publication.
 * @param   {ReviewPayload}                                        payload - Review data.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}        Submission result.
 */
export async function submitReview(
  payload: ReviewPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const api = getApi();
    const form = await api.Forms.getFormByMarker(FORM_MARKER);
    if (isError(form)) {
      return {
        ok: false,
        message:
          (form as { message?: string }).message ||
          `Form "${FORM_MARKER}" is not configured in CMS`,
      };
    }

    const formMeta = form as unknown as {
      identifier?: string;
      attributes?: FormAttribute[];
      moduleFormConfigs?: Array<{ id?: number }>;
    };

    const sortedFields = [...(formMeta.attributes ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );

    const valuesByMarker: Record<string, unknown> = {
      [RATING_MARKER]: payload.rating,
      [TEXT_MARKER]: payload.text,
    };

    const formData: FormDataType[] = sortedFields.map((field) =>
      transformFormField({
        marker: field.marker,
        type: field.type,
        value: valuesByMarker[field.marker],
        productId: payload.productId,
      }),
    );

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return { ok: false, message: validation.error || 'Invalid form data' };
    }

    const formModuleConfigId =
      formMeta.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const res = await api.FormData.postFormsData({
      formIdentifier: formMeta.identifier ?? FORM_MARKER,
      formData,
      formModuleConfigId,
      moduleEntityIdentifier: String(payload.productId),
      replayTo: null,
      status: FORM_STATUS,
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

/**
 * Placeholder Server Action for the courier/delivery review line in
 * {@link OrderReviewsPanel}. Once the `delivery_review_form` form exists in
 * OneEntry (see ONEENTRY-ADMIN-SETUP.md §1.3) this should mirror
 * {@link submitReview} and post via `api.FormData.postFormsData` with
 * `moduleEntityIdentifier=String(orderId)`. Until then it just resolves
 * `ok` so the UI flow can be exercised end-to-end.
 * @param   {{ rating: number; text: string; orderId: string | number }} payload - Review payload.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}              Submission result.
 */
export async function submitDeliveryReview(payload: {
  rating: number;
  text: string;
  orderId: string | number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!payload.text.trim()) {
    return { ok: false, message: 'Please write a review.' };
  }
  return { ok: true };
}
