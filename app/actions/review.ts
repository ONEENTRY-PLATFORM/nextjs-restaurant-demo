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
 * Маркеры, ожидаемые в форме `comment_to_product` в OneEntry.
 * UI собирает только рейтинг (звёзды) + произвольный текст; любые другие поля
 * формы, которые админ добавит (изображения, спам и т.п.), всё равно отправляются
 * через ветку по умолчанию в {@link transformFormField} и остаются пустыми.
 */
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';

/**
 * Payload отправки отзыва, собранный на клиенте.
 * Идентичность автора берётся из сессии авторизации OneEntry в SDK
 * (в UI форма доступна только после входа). Привязка к продукту
 * передаётся через `moduleEntityIdentifier`, а не через скрытое поле формы.
 * @property {number} rating    - Рейтинг звёздами 1–5.
 * @property {string} text      - Тело отзыва.
 * @property {number} productId - ID отзываемого продукта (становится `moduleEntityIdentifier`).
 */
export type ReviewPayload = {
  rating: number;
  text: string;
  productId: number;
};

/**
 * Отправляет отзыв о продукте в OneEntry FormsData (маркер `review_form`).
 *
 * Повторяет контракт отправки:
 * - поля формы читаются динамически из схемы формы, сортируются по `position`
 *   и трансформируются по типу через {@link transformFormField};
 * - `moduleEntityIdentifier` несёт id продукта, чтобы каждый отзыв был привязан
 *   к своему продукту без скрытого поля `productId` в форме;
 * - `formModuleConfigId` читается из `moduleFormConfigs[0].id` формы
 *   с общепроектным fallback;
 * - `status: 'approved'` совпадает с эталонным магазином — переключи в OneEntry,
 *   если модерация должна задерживать отзывы до публикации.
 * @param   {ReviewPayload}                                        payload - Данные отзыва.
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}        Результат отправки.
 */
export async function submitReview(
  payload: ReviewPayload,
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
        message:
          (res as { message?: string }).message || 'Failed to submit review',
      };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
