import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

/**
 * findUserField — finds the first non-empty string value among the candidate markers in `user.formData`.
 *
 * @param   {ReadonlyArray<FormDataType> | undefined} formData - User formData array.
 * @param   {readonly string[]}                       markers  - Candidate markers to probe in order.
 * @returns First matching string value, or empty string when nothing is found.
 */
export const findUserField = (
  formData: ReadonlyArray<FormDataType> | undefined,
  markers: readonly string[]
): string => {
  if (!formData) return '';
  for (const marker of markers) {
    const entry = formData.find(el => (el as { marker?: string }).marker === marker) as
      { value?: unknown } | undefined;
    if (typeof entry?.value === 'string' && entry.value) return entry.value;
  }
  return '';
};
