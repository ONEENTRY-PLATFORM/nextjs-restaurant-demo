import { unstable_noStore } from 'next/cache';

import { getApi, getLang, isError } from '@/app/api';

const FORM_MARKER = 'review_form';
const DEFAULT_MODULE_CONFIG_ID = 5;
const REVIEWS_LIMIT = 500;

/**
 * Single OneEntry FormsData entry as returned by `getFormsDataByMarker`.
 * Loosely typed because the SDK's response shape isn't exported as a
 * stable type — only the fields we actually consume are declared.
 * @property {number}      id              - Internal FormsData record id.
 * @property {number|null} parentId        - Parent record id for threaded comments (null = top-level review).
 * @property {string}      [userIdentifier] - SDK-resolved author id (set when posted under an authed session).
 * @property {string}      [time]          - ISO submission timestamp.
 * @property {Array}       formData        - Submitted field values keyed by marker.
 */
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

/**
 * Normalized review entry consumed by `<ProductReviewsList />`.
 * @property {string} id     - Stable key.
 * @property {string} author - Display name (`userIdentifier` or "Anonymous").
 * @property {string} date   - Locale-formatted date string.
 * @property {number} rating - Star rating 0–5.
 * @property {string} text   - Plain-text review body.
 */
export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

/**
 * Pull a OneEntry text field's plain value out of the polymorphic
 * `formData[].value` shape — the SDK returns a `[{ plainValue }]` array
 * for `text` fields and a string for primitives.
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns {string}        Plain text content.
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * Coerce `formData[].value` to a number for rating fields.
 * Returns `0` for missing / non-numeric values.
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns {number}        Numeric rating.
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
 * Fetch approved product reviews from OneEntry FormsData by `entityIdentifier`.
 *
 * Mirrors the read pattern from `oneentry-next-shop`'s `ReviewsSectionServer`:
 * - `unstable_noStore()` opts out of route caching so newly submitted reviews
 *   show up on the next render without manual revalidation;
 * - filter `status: ['approved']` matches the publish status set by
 *   `submitReview` server action;
 * - only top-level entries (`parentId === null`) are returned — threaded
 *   replies aren't rendered by the current UI.
 *
 * Falls back to an empty array on any SDK error or missing data so the
 * component can render `null` (per the "Resource is closed" graceful-fallback
 * rule in `ONEENTRY-ADMIN-SETUP.md`).
 * @param   {number}                    productId - Reviewed product id (becomes `entityIdentifier`).
 * @returns {Promise<ProductReview[]>}            Top-level reviews, newest first.
 */
export const getProductReviews = async (
  productId: number,
): Promise<ProductReview[]> => {
  unstable_noStore();

  try {
    const api = getApi();
    const lang = getLang();

    const form = await api.Forms.getFormByMarker(FORM_MARKER);
    const formMeta = form as unknown as {
      moduleFormConfigs?: Array<{ id?: number }>;
    };
    const formModuleConfigId =
      formMeta?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;

    const data = await api.FormData.getFormsDataByMarker(
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
      REVIEWS_LIMIT,
    );

    if (isError(data)) {
      return [];
    }

    const items = (data as unknown as { items?: RawReviewItem[] })?.items ?? [];

    return items
      .filter((item) => item.parentId === null)
      .map<ProductReview>((item) => {
        const ratingField = item.formData?.find(
          (f) => f.marker === 'review_rating',
        );
        const textField = item.formData?.find(
          (f) => f.marker === 'review_text',
        );
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
