/**
 * api.test.ts — covers the small pure helpers exported from `app/api/api/api.ts`
 * (`isError`, `getImageUrl`). The SDK instance itself is not exercised; the
 * `oneentry` package is replaced by `__mocks__/oneentry.js` via
 * `moduleNameMapper`, which keeps `defineOneEntry(...)` from hitting the real
 * backend at module load time.
 */
import { describe, expect, it } from '@jest/globals';

import { getImageUrl, isError } from '../api';

describe('isError', () => {
  it('returns true for SDK error envelopes ({statusCode, message})', () => {
    expect(isError({ statusCode: 404, message: 'Not found' })).toBe(true);
    expect(isError({ statusCode: 500, message: '' })).toBe(true);
  });

  it('returns false when one of the required fields is missing or wrong type', () => {
    expect(isError({ statusCode: 404 })).toBe(false); // no message
    expect(isError({ message: 'm' })).toBe(false); // no statusCode
    expect(isError({ statusCode: '404', message: 'm' })).toBe(false); // status not a number
    expect(isError({ statusCode: 404, message: 42 })).toBe(false); // message not a string
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
