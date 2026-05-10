import { unstable_noStore } from 'next/cache';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';

import { getApi, getLang, isError } from '@/app/api';

const FORM_MARKER = 'review_form';
// `moduleFormConfigs[0].id` of the `review_form` form = 2 (verified via the SDK). When the
// config is recreated, the first id from `getFormByMarker` always wins over this default.
const DEFAULT_MODULE_CONFIG_ID = 2;
const REVIEWS_LIMIT = 50;

/** RawReviewItem — a OneEntry FormsData record from `getFormsDataByMarker` (loosely typed — the SDK does not export a stable type). */
export interface RawReviewItem {
  id: number;
  parentId: number | null;
  userIdentifier?: string;
  time?: string;
  formData?: Array<{
    marker: string;
    type?: string;
    value?: unknown;
  }>;
}

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
 * The `status: ['approved']` filter matches the publish status from the `submitReview` server action.
 * Only top-level entries (`parentId === null`) are returned — the UI does not render nested replies.
 * Graceful fallback to an empty array on any SDK error ("Resource is closed", see MISMATCH-LOG §C).
 * @param   {number}                    productId - Product id (becomes `entityIdentifier`).
 * @returns Top-level reviews, newest first.
 */
export const getProductReviews = async (productId: number): Promise<ProductReview[]> => {
  unstable_noStore();

  try {
    const lang = getLang();

    const form = await getApi().Forms.getFormByMarker(FORM_MARKER);
    const formMeta = form as IFormsEntity as {
      moduleFormConfigs?: Array<{ id?: number }>;
    };
    const formModuleConfigId = formMeta?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

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

    const items = (data as unknown as { items?: RawReviewItem[] })?.items ?? [];

    return items
      .filter(item => item.parentId === null)
      .map<ProductReview>(item => {
        const ratingField = item.formData?.find(f => f.marker === 'review_rating');
        const textField = item.formData?.find(f => f.marker === 'review_text');
        return {
          id: String(item.id),
          author: item.userIdentifier?.trim() || 'Anonymous',
          date: item.time ? new Date(item.time).toLocaleDateString('en-US') : '',
          rating: readNumber(ratingField?.value),
          text: readPlainText(textField?.value),
        };
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
    return [];
  }
};
