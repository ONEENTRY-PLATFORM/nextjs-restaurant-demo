import { describe, expect, it } from '@jest/globals';
import type { FormDataType } from 'oneentry/types';

import { ADDRESS_MARKERS, PHONE_MARKERS } from '@/components/cart/steps/step-payment/constants';
import { findUserField } from '@/components/cart/steps/step-payment/userFields';

/**
 * mkField — builds a minimal `FormDataType`-shaped entry for tests (only `marker` + `value`).
 *
 * @param   {string} marker - Field marker as it would arrive from OneEntry.
 * @param   {unknown} value - Field value (string or non-string for negative cases).
 * @returns A FormDataType-compatible object suitable for `findUserField` input.
 */
const mkField = (marker: string, value: unknown) => ({ marker, value }) as unknown as FormDataType;

describe('findUserField', () => {
  it('returns the first matching marker in the order given by `markers`', () => {
    // formData has both `address_reg` and `address` — caller passes them in priority order.
    const formData = [mkField('address', 'fallback'), mkField('address_reg', 'preferred')];
    expect(findUserField(formData, ADDRESS_MARKERS)).toBe('preferred');
  });

  it('falls back to the next marker when the first is missing', () => {
    const formData = [mkField('address', 'only-this')];
    expect(findUserField(formData, ADDRESS_MARKERS)).toBe('only-this');
  });

  it('skips an entry whose value is an empty string and continues searching', () => {
    const formData = [mkField('address_reg', ''), mkField('address', 'real')];
    expect(findUserField(formData, ADDRESS_MARKERS)).toBe('real');
  });

  it('skips an entry whose value is non-string and continues searching', () => {
    const formData = [mkField('address_reg', { city: 'Dubai' }), mkField('address', 'real')];
    expect(findUserField(formData, ADDRESS_MARKERS)).toBe('real');
  });

  it('returns "" when none of the markers match', () => {
    const formData = [mkField('something_else', 'x')];
    expect(findUserField(formData, ADDRESS_MARKERS)).toBe('');
  });

  it('returns "" when formData is undefined or empty', () => {
    expect(findUserField(undefined, ADDRESS_MARKERS)).toBe('');
    expect(findUserField([], ADDRESS_MARKERS)).toBe('');
  });

  it('returns "" when markers array is empty', () => {
    const formData = [mkField('phone', '+1')];
    expect(findUserField(formData, [])).toBe('');
  });

  it('works the same way for PHONE_MARKERS', () => {
    const formData = [mkField('phone_reg', '+9715'), mkField('phone', '+1')];
    expect(findUserField(formData, PHONE_MARKERS)).toBe('+1'); // 'phone' is first in PHONE_MARKERS
  });
});
