'use server';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, isError } from '@/app/api';
import type { FormAttribute } from '@/components/reviews/utils/transformFormData';
import { transformFormField, validateFormData } from '@/components/reviews/utils/transformFormData';

const FORM_MARKER = 'review_form';
const FORM_STATUS = 'approved';
const DEFAULT_MODULE_CONFIG_ID = 5;

/**
 * Markers expected in the `comment_to_product` form in OneEntry.
 * The UI only collects a rating (stars) + free-form text; any other fields
 * the admin adds to the form (images, spam, etc.) are still sent through the
 * default branch in {@link transformFormField} and remain empty.
 */
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';

/**
 * Review submission payload assembled on the client.
 * Author identity is taken from the OneEntry auth session in the SDK
 * (in the UI the form is only available after login). The product binding
 * is passed via `moduleEntityIdentifier`, not via a hidden form field.
 * @property {number} rating    - Star rating 1–5.
 * @property {string} text      - Review body.
 * @property {number} productId - ID of the product being reviewed (becomes `moduleEntityIdentifier`).
 */
export type ReviewPayload = {
  rating: number;
  text: string;
  productId: number;
};

/**
 * Submits a product review to OneEntry FormsData (marker `review_form`).
 *
 * Replicates the submission contract:
 * - form fields are read dynamically from the form schema, sorted by `position`,
 *   and transformed by type via {@link transformFormField};
 * - `moduleEntityIdentifier` carries the product id so each review is bound
 *   to its product without a hidden `productId` field in the form;
 * - `formModuleConfigId` is read from the form's `moduleFormConfigs[0].id`
 *   with a project-wide fallback;
 * - `status: 'approved'` matches the reference shop — switch in OneEntry if
 *   moderation should hold reviews before publication.
 *
 * @param   {ReviewPayload}                                          payload - Review data.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}         Submission result.
 */
export async function submitReview(
  payload: ReviewPayload
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const form = await getApi().Forms.getFormByMarker(FORM_MARKER);
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
      (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );

    const valuesByMarker: Record<string, unknown> = {
      [RATING_MARKER]: payload.rating,
      [TEXT_MARKER]: payload.text,
    };

    const formData: FormDataType[] = sortedFields.map(field =>
      transformFormField({
        marker: field.marker,
        type: field.type,
        value: valuesByMarker[field.marker],
        productId: payload.productId,
      })
    );

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return { ok: false, message: validation.error || 'Invalid form data' };
    }

    const formModuleConfigId = formMeta.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const res = await getApi().FormData.postFormsData({
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
        message: (res as { message?: string }).message || 'Failed to submit review',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
