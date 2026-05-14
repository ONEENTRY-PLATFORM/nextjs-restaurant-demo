import { describe, expect, it } from '@jest/globals';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

import {
  formatAddressLine,
  parseSavedAddresses,
  pickSelectedAddress,
  type SavedAddress,
} from '../savedAddress';

/**
 * mkField — builds a minimal `FormDataType`-shaped entry for tests (only `marker` + `value`).
 *
 * @param   {string}  marker - Field marker as it would arrive from OneEntry.
 * @param   {unknown} value  - Field value (raw or serialised).
 * @returns A FormDataType-compatible object suitable for `parseSavedAddresses` input.
 */
const mkField = (marker: string, value: unknown) =>
  ({ marker, value }) as unknown as FormDataType;

const A: SavedAddress = { id: 'a1', street: 'Main', house: '12', floor: '3' };
const B: SavedAddress = { id: 'b2', street: 'Side', house: '7', floor: '', selected: true };

describe('parseSavedAddresses', () => {
  it('reads addresses from a real array value', () => {
    const formData = [mkField('user_address', [A, B])];
    expect(parseSavedAddresses(formData)).toEqual([A, B]);
  });

  it('reads addresses from a JSON-string value (OneEntry sometimes stores them serialised)', () => {
    const formData = [mkField('user_address', JSON.stringify([A]))];
    expect(parseSavedAddresses(formData)).toEqual([A]);
  });

  it('returns [] for invalid JSON', () => {
    const formData = [mkField('user_address', '{not json')];
    expect(parseSavedAddresses(formData)).toEqual([]);
  });

  it('returns [] for an empty string value', () => {
    const formData = [mkField('user_address', '')];
    expect(parseSavedAddresses(formData)).toEqual([]);
  });

  it('returns [] when the marker is missing', () => {
    const formData = [mkField('other_field', [A])];
    expect(parseSavedAddresses(formData)).toEqual([]);
  });

  it('returns [] when formData is undefined or empty', () => {
    expect(parseSavedAddresses(undefined)).toEqual([]);
    expect(parseSavedAddresses([])).toEqual([]);
  });

  it('drops entries that are not address-shaped (missing string `id`)', () => {
    const garbage = [A, { street: 'no-id' }, null, 'string', 42, { id: 42 }];
    const formData = [mkField('user_address', garbage)];
    expect(parseSavedAddresses(formData)).toEqual([A]);
  });

  it('returns [] when value is not an array (object, number, etc.)', () => {
    expect(parseSavedAddresses([mkField('user_address', { id: 'x' })])).toEqual([]);
    expect(parseSavedAddresses([mkField('user_address', 42)])).toEqual([]);
    expect(parseSavedAddresses([mkField('user_address', null)])).toEqual([]);
  });
});

describe('pickSelectedAddress', () => {
  it('returns the address with `selected: true`', () => {
    expect(pickSelectedAddress([A, B])).toBe(B);
  });

  it('falls back to the first item when nothing is marked selected', () => {
    expect(pickSelectedAddress([A, { ...B, selected: false }])).toBe(A);
  });

  it('returns null for an empty list', () => {
    expect(pickSelectedAddress([])).toBeNull();
  });

  it('returns the only item even without `selected`', () => {
    expect(pickSelectedAddress([A])).toBe(A);
  });
});

describe('formatAddressLine', () => {
  it('formats a complete address as "<street> str., <house>, fl. <floor>"', () => {
    expect(formatAddressLine(A)).toBe('Main str., 12, fl. 3');
  });

  it('skips empty floor', () => {
    expect(formatAddressLine({ id: 'x', street: 'Main', house: '12', floor: '' })).toBe(
      'Main str., 12'
    );
  });

  it('skips empty street', () => {
    expect(formatAddressLine({ id: 'x', street: '', house: '12', floor: '3' })).toBe(
      '12, fl. 3'
    );
  });

  it('returns "" for null', () => {
    expect(formatAddressLine(null)).toBe('');
  });

  it('returns "" when all fields are empty (after filtering Boolean)', () => {
    // `house` alone passes Boolean filter only when non-empty — three empties → "".
    expect(formatAddressLine({ id: 'x', street: '', house: '', floor: '' })).toBe('');
  });
});
