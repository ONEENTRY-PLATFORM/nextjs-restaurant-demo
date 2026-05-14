import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { formatDate, toLocalIsoDate } from '../formatDate';

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
});
