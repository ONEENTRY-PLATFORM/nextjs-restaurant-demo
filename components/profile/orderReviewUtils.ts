import { getApi, getLang, isError } from '@/app/api';
import { FORM_MODULE_CONFIG_IDS, FORMS } from '@/app/utils/constants';

export const FORM_MARKER = FORMS.reviewForm;
export const FORM_STATUS = 'approved';
export const DEFAULT_MODULE_CONFIG_ID = FORM_MODULE_CONFIG_IDS.reviewForm;
export const RATING_MARKER = 'review_rating';
export const TEXT_MARKER = 'review_text';

export interface ExistingReview {
  id: number;
  rating: number;
  text: string;
}

export type ItemState = {
  rating: number;
  text: string;
  loading: boolean;
  existingId: number | null;
  isEditing: boolean;
  error: string;
};

/**
 * initialItemState — derives the per-row local state from an optional existing review.
 *
 * @param   {ExistingReview | null} initial - Existing review for the product, or `null` when none was found.
 * @returns Initial `ItemState` for the row (read-only when an existing review is provided).
 */
export const initialItemState = (initial: ExistingReview | null): ItemState => ({
  rating: initial?.rating ?? 0,
  text: initial?.text ?? '',
  loading: false,
  existingId: initial?.id ?? null,
  // Already submitted review - start in read-only.
  isEditing: initial === null,
  error: '',
});

/**
 * formatOrderNumber — order number `OE…` from the SDK, otherwise fallback to the numeric id.
 *
 * @param   {{ id: number; orderId?: string }} o - Order entity with `id` and optional `orderId` string.
 * @returns Display order number.
 */
export const formatOrderNumber = (o: { id: number; orderId?: string }): string => {
  if (o.orderId) return o.orderId;
  return String(o.id);
};

/**
 * readPlainText — extracts plain text from an OneEntry field value of type `text`.
 *
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Plain text string (empty on unexpected shape).
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * readNumber — casts an OneEntry field value of type `integer` to a number (0 on error).
 *
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Numeric rating (`0` for non-numeric values).
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
 * fetchUserReview — loads the user's already submitted review for a product.
 *
 * @param   {number} productId      - OneEntry product id (used as `entityIdentifier`).
 * @param   {string} userId         - OneEntry user identifier.
 * @param   {number} moduleConfigId - `moduleFormConfigs[0].id` resolved from the form.
 * @returns Promise resolving to the existing review, or `null` when none / on SDK error (graceful fallback).
 */
export const fetchUserReview = async (
  productId: number,
  userId: string,
  moduleConfigId: number
): Promise<ExistingReview | null> => {
  try {
    const data = await getApi().FormData.getFormsDataByMarker(
      FORM_MARKER,
      moduleConfigId,
      {
        entityIdentifier: productId,
        userIdentifier: userId,
        status: ['approved'],
        dateFrom: '',
        dateTo: '',
      },
      1,
      getLang(),
      0,
      10
    );
    if (isError(data)) return null;
    const items = (
      data as unknown as {
        items?: Array<{
          id: number;
          parentId: number | null;
          userIdentifier?: string;
          formData?: Array<{ marker: string; value: unknown }>;
        }>;
      }
    ).items;
    if (!items || items.length === 0) return null;
    const mine = items
      .filter(i => i.parentId === null && i.userIdentifier === userId)
      .sort((a, b) => b.id - a.id)[0];
    if (!mine) return null;
    const ratingField = mine.formData?.find(f => f.marker === RATING_MARKER);
    const textField = mine.formData?.find(f => f.marker === TEXT_MARKER);
    return {
      id: mine.id,
      rating: readNumber(ratingField?.value),
      text: readPlainText(textField?.value),
    };
  } catch {
    return null;
  }
};
