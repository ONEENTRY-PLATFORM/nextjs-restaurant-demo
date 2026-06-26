import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  dictText,
  flatMenuToNested,
  normalizePhoneE164,
  shuffleArray,
  sortArrayByPosition,
  sortObjectFieldsByPosition,
  typeError,
  UsePrice,
} from '../utils';

describe('UsePrice', () => {
  it('drops the fractional part for whole amounts', () => {
    const out = UsePrice({ amount: 12 });
    // We don't hard-code the symbol — different ICU builds render it slightly
    // differently — but a whole amount must show "12" with no cents (per the JSDoc).
    expect(out).toMatch(/12/);
    expect(out).not.toMatch(/12[.,]\d/);
  });

  it('keeps two digits for amounts with cents', () => {
    expect(UsePrice({ amount: 16.5 })).toMatch(/16[.,]50/);
  });

  it('coerces numeric strings (whole → no cents)', () => {
    const out = UsePrice({ amount: '7' });
    expect(out).toMatch(/7/);
    expect(out).not.toMatch(/7[.,]\d/);
  });

  it('coerces numeric strings with a fractional part', () => {
    expect(UsePrice({ amount: '7.25' })).toMatch(/7[.,]25/);
  });
});

describe('normalizePhoneE164', () => {
  it('strips non-digits and prefixes with +', () => {
    expect(normalizePhoneE164('+1 (415) 555-2671')).toBe('+14155552671');
  });

  it('returns empty string for input without digits', () => {
    expect(normalizePhoneE164('---')).toBe('');
    expect(normalizePhoneE164('')).toBe('');
    expect(normalizePhoneE164(null)).toBe('');
    expect(normalizePhoneE164(undefined)).toBe('');
  });

  it('keeps single-digit input as +<digit>', () => {
    expect(normalizePhoneE164('5')).toBe('+5');
  });
});

describe('typeError', () => {
  it('returns true for objects with `statusCode`', () => {
    expect(typeError({ statusCode: 404 })).toBe(true);
  });

  it('returns false for objects without `statusCode`', () => {
    expect(typeError({ id: 1, title: 'product' })).toBe(false);
  });

  it('returns false for null / undefined', () => {
    expect(typeError(null)).toBe(false);
    expect(typeError(undefined)).toBe(false);
  });
});

describe('dictText', () => {
  it('returns dictionary value when present and string-typed', () => {
    const dict = { hello: { value: 'Привет' } } as never;
    expect(dictText(dict, 'hello', 'fallback')).toBe('Привет');
  });

  it('returns fallback when marker is missing', () => {
    expect(dictText({} as never, 'missing', 'fallback')).toBe('fallback');
  });

  it('returns fallback when value is not a string', () => {
    const dict = { count: { value: 123 } } as never;
    expect(dictText(dict, 'count', 'fallback')).toBe('fallback');
  });

  it('returns fallback when dict is undefined', () => {
    expect(dictText(undefined, 'x', 'fallback')).toBe('fallback');
  });
});

describe('sortArrayByPosition', () => {
  it('sorts in place by ascending position', () => {
    const arr = [{ position: 3 }, { position: 1 }, { position: 2 }];
    const sorted = sortArrayByPosition(arr);
    expect(sorted.map((x: { position: number }) => x.position)).toEqual([1, 2, 3]);
  });
});

describe('sortObjectFieldsByPosition', () => {
  it('orders keys by each value.position ascending', () => {
    const obj = {
      b: { position: 2, x: 'B' },
      a: { position: 1, x: 'A' },
      c: { position: 3, x: 'C' },
    };
    const sorted = sortObjectFieldsByPosition(obj);
    expect(Object.keys(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('treats missing position as 0', () => {
    const obj = {
      b: { position: 5, x: 'B' },
      a: { x: 'A' }, // no position -> 0
    };
    const sorted = sortObjectFieldsByPosition(obj);
    expect(Object.keys(sorted)).toEqual(['a', 'b']);
  });

  it('returns {} for null / undefined / non-object', () => {
    expect(sortObjectFieldsByPosition(null)).toEqual({});
    expect(sortObjectFieldsByPosition(undefined)).toEqual({});
  });
});

describe('flatMenuToNested', () => {
  it('builds a nested tree rooted at pid', () => {
    const flat = [
      { id: 1, parentId: null, title: 'Root A' },
      { id: 2, parentId: null, title: 'Root B' },
      { id: 3, parentId: 1, title: 'A1' },
      { id: 4, parentId: 3, title: 'A1a' },
    ] as never[];
    const tree = flatMenuToNested(flat as never, null) as Array<{
      id: number;
      children?: Array<{ id: number; children?: Array<{ id: number }> }>;
    }>;
    expect(tree.map(n => n.id)).toEqual([1, 2]);
    expect(tree[0]?.children?.map(n => n.id)).toEqual([3]);
    expect(tree[0]?.children?.[0]?.children?.map(n => n.id)).toEqual([4]);
  });

  it('returns leaf nodes without children property', () => {
    const flat = [{ id: 1, parentId: null }] as never[];
    const tree = flatMenuToNested(flat as never, null);
    expect(tree[0]).not.toHaveProperty('children');
  });
});

describe('shuffleArray', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a new array (does not mutate the source)', () => {
    const src = [1, 2, 3];
    const out = shuffleArray(src);
    expect(out).not.toBe(src);
    expect([...src]).toEqual([1, 2, 3]);
  });

  it('preserves all elements (just reordered)', () => {
    // Deterministic "shuffle" — Math.random returns a fixed sequence so the
    // test is repeatable and we only assert set-equality.
    let i = 0;
    const sequence = [0.9, 0.1, 0.5, 0.3];
    jest.spyOn(Math, 'random').mockImplementation(() => sequence[i++ % sequence.length]!);
    const out = shuffleArray(['a', 'b', 'c', 'd']);
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});
