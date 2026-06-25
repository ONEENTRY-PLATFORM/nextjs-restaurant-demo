import { unstable_noStore } from 'next/cache';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type {
  IFormByMarkerDataEntity,
  IFormsByMarkerDataEntity,
} from 'oneentry/dist/forms-data/formsDataInterfaces';

import { getApi, getLang, isError } from '@/app/api';

const FORM_MARKER = 'review_form';
// `moduleFormConfigs[0].id` of the `review_form` form = 2 (verified via the SDK).
const DEFAULT_MODULE_CONFIG_ID = 2;
const REVIEWS_LIMIT = 50;

/**
 * readField — value of a `formData` entry by marker.
 *
 * @param   {IFormByMarkerDataEntity} item   - Review record.
 * @param   {string}                  marker - Field marker (e.g. `review_rating`).
 * @returns Raw field value, or `undefined` when the marker is absent.
 */
const readField = (item: IFormByMarkerDataEntity, marker: string): unknown => {
  const fields = item.formData as unknown as Array<{ marker?: unknown; value?: unknown }>;
  return fields?.find(f => f.marker === marker)?.value;
};

/** ProductReview — normalised review record for `<ProductReviewsList />`. */
export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

/**
 * readPlainText — plain text from the polymorphic `formData[].value` (SDK returns `[{ plainValue }]` for `text` and a string for primitives).
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Plain text.
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * readNumber — coerces `formData[].value` to a number for the rating (`0` for non-numeric).
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Numeric rating.
 */
const readNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/**
 * getProductReviews — approved product reviews from OneEntry FormsData by `entityIdentifier`.
 *
 * `unstable_noStore()` disables the route cache — fresh reviews appear without manual revalidation.
 * The `status: ['approved']` filter matches the publish status written by `OrderReviewPopup` (the only review-submission path).
 * Only top-level entries (`parentId === null`) are returned — the UI does not render nested replies.
 * Graceful fallback to an empty array on any SDK error ("Resource is closed", see MISMATCH-LOG §C).
 * @param   {number}                    productId - Product id (becomes `entityIdentifier`).
 * @returns Top-level reviews, newest first.
 */
export const getProductReviews = async (productId: number): Promise<ProductReview[]> => {
  unstable_noStore();

  try {
    const lang = getLang();

    const form = (await getApi().Forms.getFormByMarker(FORM_MARKER)) as IFormsEntity;
    const formModuleConfigId = form?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const data = await getApi().FormData.getFormsDataByMarker(
      FORM_MARKER,
      formModuleConfigId,
      {
        entityIdentifier: productId,
        userIdentifier: '',
        status: ['approved'],
        dateFrom: '',
        dateTo: '',
      },
      1,
      lang,
      0,
      REVIEWS_LIMIT
    );

    if (isError(data)) {
      return [];
    }

    const items: IFormByMarkerDataEntity[] = (data as IFormsByMarkerDataEntity).items ?? [];

    return items
      .filter(item => item.parentId === null)
      .map<ProductReview>(item => ({
        id: String(item.id),
        author: item.userIdentifier?.trim() || 'Anonymous',
        date: item.time ? new Date(item.time).toLocaleDateString('en-US') : '',
        rating: readNumber(readField(item, 'review_rating')),
        text: readPlainText(readField(item, 'review_text')),
      }))
      .sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
    return [];
  }
};
