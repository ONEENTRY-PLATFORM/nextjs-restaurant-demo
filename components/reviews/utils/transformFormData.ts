import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

/**
 * Single OneEntry form attribute as returned by `Forms.getFormByMarker`.
 * @property {string} marker     - Field marker (used as a key when posting form data).
 * @property {string} type       - OneEntry field type (`text`, `string`, `integer`, `groupOfImages`, `spam`, `button`, …).
 * @property {number} [position] - Order in which fields are rendered.
 */
export interface FormAttribute {
  marker: string;
  type: string;
  position?: number;
}

/**
 * Per-field transform input passed to {@link transformFormField}.
 * @property {string}  marker    - Field marker.
 * @property {string}  type      - Field type from OneEntry form schema.
 * @property {unknown} value     - Raw value supplied by the UI (string / number / array).
 * @property {number}  productId - Product ID — needed to scope `groupOfImages` uploads.
 */
export interface TransformFieldParams {
  marker: string;
  type: string;
  value: unknown;
  productId: number;
}

/**
 * Convert a single UI value into a OneEntry `FormDataType` payload entry.
 * Mirrors the convention used in `oneentry-next-shop`'s `transformFormField`
 * — dispatches by marker first (`spam`, `send`), then by field type
 * (`text`, `groupOfImages`), falling through to a primitive default.
 * @param   {TransformFieldParams} params - Field input.
 * @returns {FormDataType}                FormData entry ready for `postFormsData`.
 */
export const transformFormField = ({
  marker,
  type,
  value,
  productId,
}: TransformFieldParams): FormDataType => {
  if (marker === 'spam') {
    return { marker, type: 'spam', value: '' } as unknown as FormDataType;
  }
  if (marker === 'send') {
    return { marker, type: 'button', value: '' } as unknown as FormDataType;
  }
  if (type === 'text') {
    const plain = String(value ?? '');
    return {
      marker,
      type: 'text',
      value: [{ plainValue: plain, htmlValue: plain }],
    } as unknown as FormDataType;
  }
  if (type === 'groupOfImages') {
    return {
      marker,
      type: 'groupOfImages',
      value: Array.isArray(value) ? value : [],
      fileQuery: { type: 'catalog', entity: 'editor', id: productId },
    } as unknown as FormDataType;
  }
  return {
    marker,
    type: type as 'string' | 'integer' | 'float' | 'number',
    value: typeof value === 'number' ? value : String(value ?? ''),
  } as unknown as FormDataType;
};

/**
 * Validate that a transformed FormData array has at least one non-empty content field.
 * `spam`/`button` entries are ignored — they never carry user input.
 * @param   {FormDataType[]}                       data - Transformed form payload.
 * @returns {{ isValid: boolean; error?: string }}      Validation result.
 */
export const validateFormData = (
  data: FormDataType[],
): { isValid: boolean; error?: string } => {
  if (data.length === 0) {
    return { isValid: false, error: 'No form data to submit' };
  }
  const content = data.filter((f) => f.type !== 'spam' && f.type !== 'button');
  const hasContent = content.some((f) => {
    const v = f.value;
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  });
  return hasContent
    ? { isValid: true }
    : { isValid: false, error: 'Please fill in at least one field' };
};
