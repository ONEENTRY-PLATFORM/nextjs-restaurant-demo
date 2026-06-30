/**
 * api.test.ts — covers the small pure helpers exported from `app/api/api/api.ts`
 * (`isError`, `getImageUrl`). The SDK instance itself is not exercised; the
 * `oneentry` package is replaced by `__mocks__/oneentry.js` via
 * `moduleNameMapper`, which keeps `defineOneEntry(...)` from hitting the real
 * backend at module load time.
 */
import { describe, expect, it } from '@jest/globals';

import { getImageUrl, isError } from '@/app/api/api/api';

describe('isError', () => {
  it('returns true whenever statusCode is a number (the SDK error discriminator)', () => {
    expect(isError({ statusCode: 404, message: 'Not found' })).toBe(true);
    expect(isError({ statusCode: 500, message: '' })).toBe(true);
    // Form-validator errors come back with message as string[] — these must be treated as errors.
    expect(isError({ statusCode: 400, message: ['email is required', 'name is required'] })).toBe(
      true
    );
    // message is intentionally NOT required by the guard — statusCode alone is the discriminator.
    expect(isError({ statusCode: 404 })).toBe(true);
  });

  it('returns false when statusCode is missing or not a number', () => {
    expect(isError({ message: 'm' })).toBe(false); // no statusCode
    expect(isError({ statusCode: '404', message: 'm' })).toBe(false); // statusCode not a number
  });

  it('returns false for null / undefined / primitives', () => {
    expect(isError(null)).toBe(false);
    expect(isError(undefined)).toBe(false);
    expect(isError('error')).toBe(false);
    expect(isError(404)).toBe(false);
    expect(isError(false)).toBe(false);
  });

  it('returns false for non-error objects (plain entities)', () => {
    expect(isError({ id: 1, title: 'Margherita' })).toBe(false);
  });
});

describe('getImageUrl', () => {
  it('returns the downloadLink from a single image object (Products shape)', () => {
    expect(getImageUrl({ downloadLink: 'https://cdn.example.com/a.jpg' })).toBe(
      'https://cdn.example.com/a.jpg'
    );
  });

  it('returns the FIRST item downloadLink from an array (Pages/Blocks shape)', () => {
    expect(getImageUrl([{ downloadLink: 'first.png' }, { downloadLink: 'second.png' }])).toBe(
      'first.png'
    );
  });

  it('returns "" for null / undefined', () => {
    expect(getImageUrl(null)).toBe('');
    expect(getImageUrl(undefined)).toBe('');
  });

  it('returns "" when downloadLink is missing on an object', () => {
    expect(getImageUrl({})).toBe('');
  });

  it('returns "" when an array is empty', () => {
    expect(getImageUrl([])).toBe('');
  });

  it('returns "" when the first array element has no downloadLink', () => {
    expect(getImageUrl([{}, { downloadLink: 'unused.png' }])).toBe('');
  });
});
