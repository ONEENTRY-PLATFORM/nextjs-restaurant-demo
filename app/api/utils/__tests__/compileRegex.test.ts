import { describe, expect, it } from '@jest/globals';

import { compileRegex } from '../compileRegex';

describe('compileRegex — mask tokens', () => {
  it('"9" matches a single digit', () => {
    const re = compileRegex('9');
    expect(re.test('5')).toBe(true);
    expect(re.test('a')).toBe(false);
  });

  it('"A" matches a single uppercase letter', () => {
    const re = compileRegex('A');
    expect(re.test('Z')).toBe(true);
    expect(re.test('z')).toBe(false);
    expect(re.test('5')).toBe(false);
  });

  it('"a" matches a single lowercase letter', () => {
    const re = compileRegex('a');
    expect(re.test('q')).toBe(true);
    expect(re.test('Q')).toBe(false);
  });

  it('"*" matches a single alphanumeric character', () => {
    const re = compileRegex('*');
    expect(re.test('5')).toBe(true);
    expect(re.test('A')).toBe(true);
    expect(re.test('z')).toBe(true);
    expect(re.test('-')).toBe(false);
  });

  it('"$" matches a single punctuation character `()-+`', () => {
    const re = compileRegex('$');
    expect(re.test('(')).toBe(true);
    expect(re.test(')')).toBe(true);
    expect(re.test('-')).toBe(true);
    expect(re.test('+')).toBe(true);
    expect(re.test('5')).toBe(false);
  });

  it('"[[space]]" matches whitespace', () => {
    const re = compileRegex('[[space]]');
    expect(re.test(' ')).toBe(true);
    expect(re.test('a')).toBe(false);
  });
});

describe('compileRegex — composite masks', () => {
  it('matches "$9 999 999 9999" (international phone style)', () => {
    const re = compileRegex('$9[[space]]999[[space]]999[[space]]9999');
    expect(re.test('+1 415 555 2671')).toBe(true);
    expect(re.test('+1-415-555-2671')).toBe(false); // requires literal spaces
  });

  it('anchors the pattern (full-string match only)', () => {
    const re = compileRegex('9');
    expect(re.test('123')).toBe(false); // not anchored would match '1'
  });

  it('combines digit + lower + punctuation', () => {
    const re = compileRegex('9a$');
    expect(re.test('1a-')).toBe(true);
    expect(re.test('1A-')).toBe(false);
  });

  it('literal characters in the mask must appear verbatim', () => {
    const re = compileRegex('id:9999');
    expect(re.test('id:1234')).toBe(true);
    expect(re.test('id:12')).toBe(false);
    expect(re.test('ID:1234')).toBe(false);
  });
});
