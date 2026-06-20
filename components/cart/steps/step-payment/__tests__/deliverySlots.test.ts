import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  buildDeliveryTimeInterval,
  makeGetSlots,
  parseDeliverySchedule,
  type TimeIntervalAttribute,
} from '../deliverySlots';

// Mirrors the real `delivery_time.localizeInfos.intervals[]` shape: slots live in `timeIntervals`,
// not on `attribute.value`. 2025-05-01 is a Thursday (UTC weekday 4), 2025-05-02 a Friday (5).
const thursdayOnlyAttr: TimeIntervalAttribute = {
  type: 'timeInterval',
  localizeInfos: {
    intervals: [
      {
        timeIntervals: [
          ['2025-05-01T10:00:00.000Z', '2025-05-01T10:15:00.000Z'],
          ['2025-05-01T10:15:00.000Z', '2025-05-01T10:30:00.000Z'],
        ],
      },
    ],
  },
};

describe('parseDeliverySchedule', () => {
  it('extracts distinct time-of-day slots and covered weekdays from timeIntervals', () => {
    const schedule = parseDeliverySchedule(thursdayOnlyAttr);
    expect(schedule.hasData).toBe(true);
    expect(schedule.slots.map(s => s.label)).toEqual(['10.00', '10.15']);
    expect(schedule.slots[0]).toMatchObject({ startMin: 600, endMin: 615 });
    expect([...schedule.weekdays]).toEqual([4]); // Thursday only
  });

  it('falls back to the start/end/period template when no flattened timeIntervals exist', () => {
    const schedule = parseDeliverySchedule({
      type: 'timeInterval',
      localizeInfos: {
        intervals: [{ intervals: [{ start: { hours: 10 }, end: { hours: 11 }, period: 30 }] }],
      },
    });
    expect(schedule.hasData).toBe(true);
    expect(schedule.slots.map(s => s.label)).toEqual(['10.00', '10.30']);
  });

  it('treats a 7-weekday pattern as "every day" (empty weekday filter)', () => {
    const everyDay: TimeIntervalAttribute = {
      type: 'timeInterval',
      localizeInfos: {
        intervals: [
          {
            // 2025-05-01..2025-05-07 covers all 7 weekdays.
            timeIntervals: Array.from({ length: 7 }, (_, i) => {
              const d = `2025-05-0${i + 1}`;
              return [`${d}T10:00:00.000Z`, `${d}T10:15:00.000Z`] as [string, string];
            }),
          },
        ],
      },
    };
    const schedule = parseDeliverySchedule(everyDay);
    expect(schedule.weekdays.size).toBe(0);
  });

  it('returns hasData=false for missing / empty input', () => {
    expect(parseDeliverySchedule(undefined).hasData).toBe(false);
    expect(parseDeliverySchedule({ type: 'timeInterval', localizeInfos: {} }).hasData).toBe(false);
  });
});

describe('makeGetSlots', () => {
  it('returns labels for a covered weekday and [] for an uncovered one', () => {
    const getSlots = makeGetSlots(parseDeliverySchedule(thursdayOnlyAttr));
    expect(getSlots).toBeDefined();
    expect(getSlots!('2025-05-01')).toEqual(['10.00', '10.15']); // Thursday
    expect(getSlots!('2025-05-02')).toEqual([]); // Friday — not covered
  });

  it('returns undefined when the form has no slot data (caller keeps default picker)', () => {
    expect(makeGetSlots(parseDeliverySchedule(undefined))).toBeUndefined();
  });
});

describe('buildDeliveryTimeInterval — asap', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-14T10:00:00.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns [[now, now + 45 min]]', () => {
    const result = buildDeliveryTimeInterval('asap', '');
    expect(result).toEqual([['2026-05-14T10:00:00.000Z', '2026-05-14T10:45:00.000Z']]);
  });
});

describe('buildDeliveryTimeInterval — scheduled', () => {
  it('uses the matching slot duration from the schedule (15 min)', () => {
    const schedule = parseDeliverySchedule(thursdayOnlyAttr);
    const result = buildDeliveryTimeInterval('scheduled', '14.05.26 10.00', schedule);
    expect(result).toEqual([['2026-05-14T10:00:00.000Z', '2026-05-14T10:15:00.000Z']]);
  });

  it('defaults to a 15-min interval when no schedule is provided', () => {
    const result = buildDeliveryTimeInterval('scheduled', '14.05.26 12.30');
    expect(result).toEqual([['2026-05-14T12:30:00.000Z', '2026-05-14T12:45:00.000Z']]);
  });

  it('returns null on partial / malformed input', () => {
    expect(buildDeliveryTimeInterval('scheduled', '')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '14.05.26')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '14-05-26 12.30')).toBeNull();
    expect(buildDeliveryTimeInterval('scheduled', '14.5.26 12.30')).toBeNull(); // not zero-padded
  });
});
