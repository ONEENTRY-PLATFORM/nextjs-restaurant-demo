import { describe, expect, it } from '@jest/globals';

import { validators } from '../validators';

describe('validators.requiredValidator', () => {
  it('returns false on empty string', () => {
    expect(validators.requiredValidator('')).toBe(false);
  });
  it('returns true on non-empty string', () => {
    expect(validators.requiredValidator('x')).toBe(true);
  });
  it('returns true on whitespace (this is by design — trim is caller-side)', () => {
    expect(validators.requiredValidator(' ')).toBe(true);
  });
});

describe('validators.emailInspectionValidator', () => {
  it.each(['foo@bar.com', 'first.last@example.co.uk', 'a@b.cd'])('accepts %s', email => {
    expect(validators.emailInspectionValidator(email)).toBe(true);
  });

  it.each([
    '',
    'plain',
    'no-at-sign.com',
    '@nolocal.com',
    'spaces in@email.com',
    'trailing.dot@domain.',
  ])('rejects %s', email => {
    expect(validators.emailInspectionValidator(email)).toBe(false);
  });

  // Known limitation of the current regex `[\w-]+(\.[\w-]+)*@…`: the local part
  // does not allow `+`, so Gmail-style plus-tags (`user+tag@gmail.com`) are
  // rejected. Documented here as a regression guard — if the regex is widened
  // to accept `+`, this test should flip to `.toBe(true)`.
  it('rejects plus-tagged local part (current regex limitation)', () => {
    expect(validators.emailInspectionValidator('user+tag@domain.io')).toBe(false);
  });
});

describe('validators.stringInspectionValidator', () => {
  it('passes when length matches exact stringLength', () => {
    expect(validators.stringInspectionValidator('1234', { stringLength: 4 })).toBe(true);
  });
  it('fails when length does not match exact stringLength', () => {
    expect(validators.stringInspectionValidator('123', { stringLength: 4 })).toBe(false);
  });
  it('passes when length is inside [stringMin, stringMax]', () => {
    expect(validators.stringInspectionValidator('abc', { stringMin: 2, stringMax: 5 })).toBe(true);
  });
  it('fails when length is below stringMin', () => {
    expect(validators.stringInspectionValidator('a', { stringMin: 2, stringMax: 5 })).toBe(false);
  });
  it('fails when length is above stringMax', () => {
    expect(validators.stringInspectionValidator('abcdef', { stringMin: 2, stringMax: 5 })).toBe(
      false
    );
  });
  it('coerces string bounds (OneEntry sometimes returns them as strings)', () => {
    expect(validators.stringInspectionValidator('abc', { stringMin: '2', stringMax: '5' })).toBe(
      true
    );
  });
});

describe('validators.correctPasswordValidator', () => {
  it('returns true when values match', () => {
    expect(validators.correctPasswordValidator('Pass1!', 'Pass1!')).toBe(true);
  });
  it('returns false when values differ', () => {
    expect(validators.correctPasswordValidator('Pass1!', 'Pass2!')).toBe(false);
  });
  it('treats empty strings as a valid match (caller must combine with requiredValidator)', () => {
    expect(validators.correctPasswordValidator('', '')).toBe(true);
  });
});
