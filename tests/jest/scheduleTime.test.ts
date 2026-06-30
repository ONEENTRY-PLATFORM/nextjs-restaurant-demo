import { describe, expect, it } from '@jest/globals';

import {
  formatScheduleAt,
  parseScheduleAt,
} from '@/components/cart/steps/step-payment/scheduleTime';

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
