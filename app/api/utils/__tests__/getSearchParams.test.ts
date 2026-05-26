import { describe, expect, it } from '@jest/globals';

import getSearchParams from '../getSearchParams';

describe('getSearchParams — service-products filter (always present)', () => {
  it('returns the SKU-not-null filter as the only element when there are no params', () => {
    const result = getSearchParams();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      attributeMarker: 'sku',
      conditionMarker: 'nin',
      conditionValue: null,
      title: '',
      isNested: false,
    });
  });

  it('propagates `search` text into every filter as `title`', () => {
    const result = getSearchParams({ search: 'pizza', preferences: 'Meat' });
    expect(result.length).toBeGreaterThan(1);
    expect(result.every(f => f.title === 'pizza')).toBe(true);
  });
});

describe('getSearchParams — preferences (multi-select → multiple filters)', () => {
  it('splits comma-separated values into independent filters', () => {
    const result = getSearchParams({ preferences: 'Meat,Fish,Vegan' });
    const prefs = result.filter(f => f.attributeMarker === 'preferences');
    expect(prefs).toHaveLength(3);
    expect(prefs.map(p => p.conditionValue)).toEqual(['Meat', 'Fish', 'Vegan']);
  });

  it('trims whitespace and drops empty fragments', () => {
    const result = getSearchParams({ preferences: ' Meat , , Fish ,' });
    const prefs = result.filter(f => f.attributeMarker === 'preferences');
    expect(prefs.map(p => p.conditionValue)).toEqual(['Meat', 'Fish']);
  });

  it('produces no preferences filters when the value is empty/whitespace', () => {
    const result = getSearchParams({ preferences: ' , , ' });
    expect(result.filter(f => f.attributeMarker === 'preferences')).toHaveLength(0);
  });
});

describe('getSearchParams — filter (multi-select → multiple filters)', () => {
  it('splits comma-separated values into independent filters', () => {
    const result = getSearchParams({ filter: 'Dinner,Soup,Vegetarian' });
    const list = result.filter(f => f.attributeMarker === 'filter');
    expect(list).toHaveLength(3);
    expect(list.map(p => p.conditionValue)).toEqual(['Dinner', 'Soup', 'Vegetarian']);
  });

  it('trims whitespace and drops empty fragments', () => {
    const result = getSearchParams({ filter: ' Dinner , , Soup ,' });
    const list = result.filter(f => f.attributeMarker === 'filter');
    expect(list.map(p => p.conditionValue)).toEqual(['Dinner', 'Soup']);
  });

  it('produces no filter rows when the value is empty/whitespace', () => {
    const result = getSearchParams({ filter: ' , , ' });
    expect(result.filter(f => f.attributeMarker === 'filter')).toHaveLength(0);
  });

  it('coexists with preferences', () => {
    const result = getSearchParams({ preferences: 'Meat', filter: 'Dinner' });
    expect(result.filter(f => f.attributeMarker === 'preferences')).toHaveLength(1);
    expect(result.filter(f => f.attributeMarker === 'filter')).toHaveLength(1);
  });
});

describe('getSearchParams — price range', () => {
  it('adds minPrice (`mth`) and maxPrice (`lth`) when both are numeric', () => {
    const result = getSearchParams({ minPrice: '10', maxPrice: '99' });
    const price = result.filter(f => f.attributeMarker === 'price');
    expect(price).toHaveLength(2);
    expect(price.find(f => f.conditionMarker === 'mth')?.conditionValue).toBe(10);
    expect(price.find(f => f.conditionMarker === 'lth')?.conditionValue).toBe(99);
  });

  it('coerces price strings to numbers', () => {
    const result = getSearchParams({ minPrice: '12.5' });
    const min = result.find(f => f.conditionMarker === 'mth');
    expect(min?.conditionValue).toBe(12.5);
  });

  it('skips price filters when the value is not a finite number', () => {
    const result = getSearchParams({ minPrice: 'abc', maxPrice: 'NaN' });
    expect(result.filter(f => f.attributeMarker === 'price')).toHaveLength(0);
  });

  it('accepts price = "0" (Number(\'0\') is finite)', () => {
    // Quirk: the implementation guards on the truthy string, then `Number.isFinite`.
    // "0" is truthy as a non-empty string, so a 0 boundary IS added.
    const result = getSearchParams({ minPrice: '0' });
    expect(result.find(f => f.conditionMarker === 'mth')?.conditionValue).toBe(0);
  });
});

describe('getSearchParams — cooking_time_max', () => {
  it('adds a cooking_time `lth` filter when numeric', () => {
    const result = getSearchParams({ cooking_time_max: '30' });
    const ck = result.find(f => f.attributeMarker === 'cooking_time');
    expect(ck).toMatchObject({
      attributeMarker: 'cooking_time',
      conditionMarker: 'lth',
      conditionValue: 30,
    });
  });

  it('skips when not numeric', () => {
    const result = getSearchParams({ cooking_time_max: 'fast' });
    expect(result.find(f => f.attributeMarker === 'cooking_time')).toBeUndefined();
  });
});
