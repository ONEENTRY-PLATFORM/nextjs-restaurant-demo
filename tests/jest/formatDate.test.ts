import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { formatDate, toLocalIsoDate } from '@/app/utils/formatDate';

describe('formatDate', () => {
  it('formats a Date as "dd.MM.yy"', () => {
    expect(formatDate(new Date(2026, 4, 14))).toBe('14.05.26'); // May = month 4 (0-indexed)
  });

  it('zero-pads single-digit day and month', () => {
    expect(formatDate(new Date(2026, 0, 3))).toBe('03.01.26');
  });

  it('takes the last two digits of the year', () => {
    expect(formatDate(new Date(2099, 11, 31))).toBe('31.12.99');
  });

  it('parses an ISO string', () => {
    // Use a UTC-noon timestamp so the local-tz adjustment doesn't move the date.
    expect(formatDate('2026-05-14T12:00:00.000Z')).toMatch(/^\d{2}\.05\.26$/);
  });

  it('accepts a numeric (ms) timestamp', () => {
    const ms = new Date(2026, 4, 14, 12, 0, 0).getTime();
    expect(formatDate(ms)).toBe('14.05.26');
  });

  it('returns "" for undefined / empty / 0', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate(0)).toBe('');
  });

  it('returns "" for an unparseable string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('returns "" for `null` (falsy, even though TS forbids it)', () => {
    // Runtime safety net — `attributeValues?.[marker]?.value` can come back as `null`.
    expect(formatDate(null as unknown as undefined)).toBe('');
  });

  it('returns "" for `NaN` (falsy)', () => {
    expect(formatDate(NaN)).toBe('');
  });

  it('returns "" for an Invalid Date object', () => {
    expect(formatDate(new Date('garbage'))).toBe('');
  });

  it('handles year boundaries — slice(2) of 1999/2000/2100', () => {
    expect(formatDate(new Date(1999, 11, 31))).toBe('31.12.99');
    expect(formatDate(new Date(2000, 0, 1))).toBe('01.01.00');
    expect(formatDate(new Date(2100, 0, 1))).toBe('01.01.00');
  });

  it('ignores time-of-day (only date components matter)', () => {
    expect(formatDate(new Date(2026, 4, 14, 23, 59, 59))).toBe('14.05.26');
    expect(formatDate(new Date(2026, 4, 14, 0, 0, 0))).toBe('14.05.26');
  });

  it('handles leap day Feb 29', () => {
    expect(formatDate(new Date(2024, 1, 29))).toBe('29.02.24');
  });
});

describe('toLocalIsoDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats a Date as "YYYY-MM-DD" in the local time zone', () => {
    // Construct via local-time constructor so the output reflects the local calendar day,
    // not the UTC one (this is the whole reason `toLocalIsoDate` exists — see the JSDoc).
    expect(toLocalIsoDate(new Date(2026, 4, 14))).toBe('2026-05-14');
  });

  it('zero-pads single-digit month and day', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
  });

  it('defaults the argument to "now"', () => {
    // Freeze "now" so the test is deterministic across runs.
    jest.useFakeTimers().setSystemTime(new Date(2026, 5, 7, 10, 0, 0));
    expect(toLocalIsoDate()).toBe('2026-06-07');
  });

  it('handles leap day Feb 29 in local TZ', () => {
    expect(toLocalIsoDate(new Date(2024, 1, 29))).toBe('2024-02-29');
  });

  it('handles end-of-year midnight (no UTC shift)', () => {
    // The whole reason this helper exists: `toISOString()` here would roll to
    // "2027-01-01" in positive UTC offsets — the helper must hold to local 2026-12-31.
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
  });
});
