import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

/** A single OneEntry form attribute returned by `Forms.getFormByMarker`. */
export interface FormAttribute {
  marker: string;
  type: string;
  position?: number;
}

/** Input parameters for transforming a single field, passed to {@link transformFormField}. */
export interface TransformFieldParams {
  marker: string;
  type: string;
  value: unknown;
  productId: number;
}

/**
 * Converts a single UI value into a `FormDataType` payload record.
 * Dispatches first by marker (`spam`, `send`), then by field type.
 * @param   {TransformFieldParams} params - Field input parameters.
 * @returns {FormDataType}                FormData record for `postFormsData`.
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
    // OneEntry: «Only one of htmlValue, plainValue or mdValue can be provided».
    return {
      marker,
      type: 'text',
      value: [{ plainValue: plain }],
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
 * Validates that the payload contains at least one non-empty content field (spam/button are ignored).
 * @param   {FormDataType[]}                       data - Transformed form payload.
 * @returns {{ isValid: boolean; error?: string }}      Validation result.
 */
export const validateFormData = (data: FormDataType[]): { isValid: boolean; error?: string } => {
  if (data.length === 0) {
    return { isValid: false, error: 'No form data to submit' };
  }
  const content = data.filter(f => f.type !== 'spam' && f.type !== 'button');
  const hasContent = content.some(f => {
    const v = f.value;
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  });
  return hasContent
    ? { isValid: true }
    : { isValid: false, error: 'Please fill in at least one field' };
};
