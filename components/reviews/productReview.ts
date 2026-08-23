import type { FormDataType, IFormByMarkerDataEntity } from 'oneentry/types';

/** ProductReview — normalised review record for `<ProductReviewsList />`. */
export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

/**
 * hasMarker — narrows a `FormDataType` union member to a `{ marker, value }` field entry.
 *
 * @param   {FormDataType} field - Form data entry from `item.formData`.
 * @returns `true` when the entry carries a string `marker`.
 */
const hasMarker = (
  field: FormDataType
): field is FormDataType & { marker: string; value?: unknown } =>
  typeof (field as { marker?: unknown }).marker === 'string';

/**
 * readField — value of a `formData` entry by marker.
 *
 * @param   {IFormByMarkerDataEntity} item   - Review record.
 * @param   {string}                  marker - Field marker (e.g. `review_rating`).
 * @returns Raw field value, or `undefined` when the marker is absent.
 */
const readField = (item: IFormByMarkerDataEntity, marker: string): unknown => {
  const fields: FormDataType[] = Array.isArray(item.formData) ? item.formData : [];
  const match = fields.find(f => hasMarker(f) && f.marker === marker);
  return match && hasMarker(match) ? match.value : undefined;
};

/**
 * readPlainText — plain text from the polymorphic `formData[].value` (SDK returns `[{ plainValue }]` for `text` and a string for primitives).
 *
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
 *
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
 * productReviewFromFormData — maps a OneEntry review record onto the `ProductReview` view model.
 *
 * Reads `review_rating` / `review_text` from `formData` by marker and formats the submit time.
 *
 * @param   {IFormByMarkerDataEntity} item - Review record from `getProductReviews`.
 * @returns Review view model for `<ProductReviewsList />`.
 */
export const productReviewFromFormData = (item: IFormByMarkerDataEntity): ProductReview => ({
  id: String(item.id),
  author: item.userIdentifier?.trim() || 'Anonymous',
  date: item.time ? new Date(item.time).toLocaleDateString('en-US') : '',
  rating: readNumber(readField(item, 'review_rating')),
  text: readPlainText(readField(item, 'review_text')),
});
