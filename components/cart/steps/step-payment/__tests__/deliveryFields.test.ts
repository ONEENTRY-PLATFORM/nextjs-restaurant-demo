import { describe, expect, it } from '@jest/globals';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

import { HANDLED_MARKERS, inputTypeForAttribute, selectGenericFields } from '../deliveryFields';

/** Minimal IFormAttribute factory — only the fields the helpers read. */
const attr = (over: Partial<IFormAttribute>): IFormAttribute =>
  ({
    marker: 'x',
    type: 'string',
    position: 0,
    isVisible: true,
    localizeInfos: { title: '' },
    additionalFields: {},
    ...over,
  }) as IFormAttribute;

describe('inputTypeForAttribute', () => {
  it('maps known OneEntry types to HTML input types', () => {
    expect(inputTypeForAttribute('email')).toBe('email');
    expect(inputTypeForAttribute('phone')).toBe('tel');
    expect(inputTypeForAttribute('number')).toBe('number');
    expect(inputTypeForAttribute('integer')).toBe('number');
    expect(inputTypeForAttribute('float')).toBe('number');
  });

  it('falls back to text for string / unknown / undefined', () => {
    expect(inputTypeForAttribute('string')).toBe('text');
    expect(inputTypeForAttribute('whatever')).toBe('text');
    expect(inputTypeForAttribute(undefined)).toBe('text');
  });
});

describe('selectGenericFields', () => {
  it('excludes bespoke / profile / internal markers and keeps the rest', () => {
    const fields = [
      attr({ marker: 'delivery_address', position: 2 }),
      attr({ marker: 'delivery_time', position: 1 }),
      attr({ marker: 'contact_phone', position: 3 }),
      attr({ marker: 'comment', position: 4 }),
      attr({ marker: 'alt_phone', position: 7 }),
      attr({ marker: 'addresses', position: 8 }),
      attr({ marker: 'gift_note', position: 5 }),
    ];
    expect(selectGenericFields(fields).map(f => f.marker)).toEqual(['gift_note']);
  });

  it('sorts kept fields by position and drops hidden ones', () => {
    const fields = [
      attr({ marker: 'b', position: 9 }),
      attr({ marker: 'hidden', position: 1, isVisible: false }),
      attr({ marker: 'a', position: 3 }),
    ];
    expect(selectGenericFields(fields).map(f => f.marker)).toEqual(['a', 'b']);
  });

  it('returns [] for undefined input and keeps every bespoke marker handled', () => {
    expect(selectGenericFields(undefined)).toEqual([]);
    for (const m of [
      'delivery_address',
      'delivery_time',
      'comment',
      'alt_phone',
      'contact_phone',
      'addresses',
    ]) {
      expect(HANDLED_MARKERS.has(m)).toBe(true);
    }
  });
});
