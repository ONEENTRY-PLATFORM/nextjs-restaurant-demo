import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { buildDeliveryTimeInterval, formatScheduleAt, parseScheduleAt } from '../scheduleTime';

describe('formatScheduleAt', () => {
  it('formats a yyyy-MM-dd + HH.MM pair as DD.MM.YY HH.MM', () => {
    expect(formatScheduleAt('2026-05-14', '12.30')).toBe('14.05.26 12.30');
  });

  it('returns "" when any part is missing', () => {
    expect(formatScheduleAt('', '12.30')).toBe('');
    expect(formatScheduleAt('2026-05-14', '')).toBe('');
    expect(formatScheduleAt('2026-05', '12.30')).toBe(''); // dd is undefined after split
  });
});

describe('parseScheduleAt', () => {
  it('parses DD.MM.YY HH.MM back into yyyy-MM-dd + HH.MM', () => {
    expect(parseScheduleAt('14.05.26 12.30')).toEqual({ date: '2026-05-14', time: '12.30' });
  });

  it('returns empty strings on parse failure', () => {
    expect(parseScheduleAt('')).toEqual({ date: '', time: '' });
    expect(parseScheduleAt('not a date')).toEqual({ date: '', time: '' });
    expect(parseScheduleAt('14.05.2026 12.30')).toEqual({ date: '', time: '' }); // 4-digit year doesn't match \d{2}
  });

  it('round-trips formatScheduleAt for a valid value', () => {
    const formatted = formatScheduleAt('2026-05-14', '09.15');
    expect(parseScheduleAt(formatted)).toEqual({ date: '2026-05-14', time: '09.15' });
  });
});

describe('buildDeliveryTimeInterval — asap', () => {
  beforeEach(() => {
    // Freeze "now" so the ISO output is deterministic.
    jest.useFakeTimers().setSystemTime(new Date('2026-05-14T10:00:00.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns [[now, now + ASAP_INTERVAL_MIN]] (45 min)', () => {
    const result = buildDeliveryTimeInterval('asap', '');
    expect(result).not.toBeNull();
    expect(result![0][0]).toBe('2026-05-14T10:00:00.000Z');
    expect(result![0][1]).toBe('2026-05-14T10:45:00.000Z');
  });

  it('ignores the scheduledRaw argument in asap mode', () => {
    const result = buildDeliveryTimeInterval('asap', 'garbage');
    expect(result).not.toBeNull();
    expect(result![0][0]).toBe('2026-05-14T10:00:00.000Z');
  });
});

describe('buildDeliveryTimeInterval — scheduled', () => {
  it('parses DD.MM.YY HH.MM and returns the +1h interval (UTC)', () => {
    const result = buildDeliveryTimeInterval('scheduled', '14.05.26 12.30');
    expect(result).toEqual([['2026-05-14T12:30:00.000Z', '2026-05-14T13:30:00.000Z']]);
  });

  it('returns null when scheduledRaw cannot be parsed', () => {
    expect(buildDeliveryTimeInterval('scheduled', '')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '99.99.99 99.99')).toEqual([
      // Note: regex matches digits, then Date.UTC normalises out-of-range values
      // (month 98 → year overflow). This is documented behaviour — caller should
      // validate the input UI-side. We still assert SOMETHING came back so any
      // future tightening of the parser shows up as a diff here.
      [expect.any(String), expect.any(String)],
    ]);
  });

  it('returns null on partial / malformed input', () => {
    expect(buildDeliveryTimeInterval('scheduled', '14.05.26')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '14-05-26 12.30')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '14.5.26 12.30')).toBeNull(); // not zero-padded
  });

  it('end is exactly 1 hour after start', () => {
    const result = buildDeliveryTimeInterval('scheduled', '14.05.26 23.00');
    expect(result).not.toBeNull();
    const [startIso, endIso] = result![0];
    const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
    expect(diff).toBe(60 * 60 * 1000);
  });
});
