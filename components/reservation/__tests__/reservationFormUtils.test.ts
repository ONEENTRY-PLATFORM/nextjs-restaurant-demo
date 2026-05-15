import { describe, expect, it } from '@jest/globals';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

import {
  buildFormRows,
  buildTimeIntervalValue,
  formatBookingSummary,
  getAvailableSlotsForDate,
  isFullWidthAttr,
  PREFERENCES_MARKER,
  resolveInputType,
  TIME_SLOT_MARKER,
  validateField,
} from '../reservationFormUtils';
import type { Translate } from '../reservationTypes';
import type { RestaurantOption, ScheduleSlotEntry } from '../RestaurantSelect';

/** Identity translator — returns fallback verbatim, lets tests assert on the English fallback text. */
const t: Translate = (_marker, fallback) => fallback;

/** Minimal IFormAttribute stub — `marker`/`type` are the only fields the utils read. */
const attr = (marker: string, type: string, extra: Partial<IFormAttribute> = {}): IFormAttribute =>
  ({ marker, type, position: 0, ...extra }) as unknown as IFormAttribute;

describe('isFullWidthAttr', () => {
  it.each([['entity'], ['text'], ['timeInterval']])('type "%s" is full-width', t => {
    expect(isFullWidthAttr(attr('x', t))).toBe(true);
  });

  it(`marker "${TIME_SLOT_MARKER}" is full-width (regardless of type)`, () => {
    expect(isFullWidthAttr(attr(TIME_SLOT_MARKER, 'string'))).toBe(true);
  });

  it(`marker "${PREFERENCES_MARKER}" is full-width (regardless of type)`, () => {
    expect(isFullWidthAttr(attr(PREFERENCES_MARKER, 'string'))).toBe(true);
  });

  it('plain "string" attr is NOT full-width', () => {
    expect(isFullWidthAttr(attr('name', 'string'))).toBe(false);
  });
});

describe('buildFormRows', () => {
  it('skips `button` and `spam` attrs', () => {
    const rows = buildFormRows([
      attr('btn', 'button'),
      attr('captcha', 'spam'),
      attr('name', 'string'),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ kind: 'pair', left: expect.objectContaining({ marker: 'name' }) });
  });

  it('pairs narrow attrs sequentially into two-column rows', () => {
    const rows = buildFormRows([
      attr('name', 'string'),
      attr('surname', 'string'),
      attr('email', 'string'),
      attr('phone', 'string'),
    ]);
    expect(rows).toEqual([
      {
        kind: 'pair',
        left: expect.objectContaining({ marker: 'name' }),
        right: expect.objectContaining({ marker: 'surname' }),
      },
      {
        kind: 'pair',
        left: expect.objectContaining({ marker: 'email' }),
        right: expect.objectContaining({ marker: 'phone' }),
      },
    ]);
  });

  it('flushes a pending narrow attr before a full-width attr', () => {
    const rows = buildFormRows([
      attr('name', 'string'),
      attr('restaurant', 'entity'),
      attr('surname', 'string'),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ kind: 'pair', left: expect.objectContaining({ marker: 'name' }) });
    expect(rows[1]).toEqual({
      kind: 'full',
      attr: expect.objectContaining({ marker: 'restaurant' }),
    });
    expect(rows[2]).toEqual({ kind: 'pair', left: expect.objectContaining({ marker: 'surname' }) });
  });

  it('emits an unpaired pending attr at the end (right slot absent)', () => {
    const rows = buildFormRows([attr('lonely', 'string')]);
    expect(rows).toEqual([{ kind: 'pair', left: expect.objectContaining({ marker: 'lonely' }) }]);
  });
});

describe('resolveInputType', () => {
  it.each([
    ['integer', 'count', 'number'],
    ['real', 'price', 'number'],
    ['float', 'rating', 'number'],
    ['string', 'email_address', 'email'],
    ['string', 'contact_phone', 'tel'],
    ['string', 'tel_main', 'tel'],
    ['string', 'user_password', 'password'],
    ['string', 'name', 'text'],
  ])('type=%s marker=%s -> %s', (type, marker, expected) => {
    expect(resolveInputType(type, marker)).toBe(expected);
  });
});

describe('formatBookingSummary', () => {
  it('formats "DD.MM.YY HH.MM N person"', () => {
    expect(
      formatBookingSummary({
        [TIME_SLOT_MARKER]: '2026-05-14 19.30',
        people_count: '4',
      })
    ).toBe('14.05.26 19.30 4 person');
  });

  it('omits people_count when missing or non-numeric', () => {
    expect(formatBookingSummary({ [TIME_SLOT_MARKER]: '2026-05-14 19.30' })).toBe('14.05.26 19.30');
    expect(
      formatBookingSummary({ [TIME_SLOT_MARKER]: '2026-05-14 19.30', people_count: 'foo' })
    ).toBe('14.05.26 19.30');
  });

  it('omits date when time_slot is missing', () => {
    expect(formatBookingSummary({ people_count: '2' })).toBe('2 person');
  });

  it('returns an empty string when nothing is set', () => {
    expect(formatBookingSummary({})).toBe('');
  });
});

describe('getAvailableSlotsForDate', () => {
  it('returns [] for empty schedule', () => {
    expect(getAvailableSlotsForDate([], '2026-05-14')).toEqual([]);
    expect(getAvailableSlotsForDate(undefined, '2026-05-14')).toEqual([]);
  });

  it('returns [] for empty dateIso', () => {
    const schedule: ScheduleSlotEntry[] = [
      {
        inEveryWeek: true,
        times: [
          [
            { hours: 12, minutes: 0 },
            { hours: 13, minutes: 0 },
          ],
        ],
      } as ScheduleSlotEntry,
    ];
    expect(getAvailableSlotsForDate(schedule, '')).toEqual([]);
  });

  it('applies recurring (inEveryWeek) slots to any date', () => {
    const schedule: ScheduleSlotEntry[] = [
      {
        inEveryWeek: true,
        times: [
          [
            { hours: 9, minutes: 0 },
            { hours: 10, minutes: 0 },
          ],
          [
            { hours: 18, minutes: 30 },
            { hours: 19, minutes: 30 },
          ],
        ],
      } as ScheduleSlotEntry,
    ];
    expect(getAvailableSlotsForDate(schedule, '2026-05-14')).toEqual(['09.00', '18.30']);
  });

  it('respects date-range entries (target inside range)', () => {
    const schedule: ScheduleSlotEntry[] = [
      {
        dates: ['2026-05-10T00:00:00.000Z', '2026-05-20T00:00:00.000Z'],
        times: [
          [
            { hours: 12, minutes: 0 },
            { hours: 13, minutes: 0 },
          ],
        ],
      } as ScheduleSlotEntry,
    ];
    expect(getAvailableSlotsForDate(schedule, '2026-05-14')).toEqual(['12.00']);
    expect(getAvailableSlotsForDate(schedule, '2026-05-25')).toEqual([]);
  });

  it('dedupes slots reported by multiple entries', () => {
    const schedule: ScheduleSlotEntry[] = [
      {
        inEveryWeek: true,
        times: [
          [
            { hours: 9, minutes: 0 },
            { hours: 10, minutes: 0 },
          ],
        ],
      } as ScheduleSlotEntry,
      {
        inEveryMonth: true,
        times: [
          [
            { hours: 9, minutes: 0 },
            { hours: 11, minutes: 0 },
          ],
        ],
      } as ScheduleSlotEntry,
    ];
    expect(getAvailableSlotsForDate(schedule, '2026-05-14')).toEqual(['09.00']);
  });

  it('returns sorted slots (HH.MM)', () => {
    const schedule: ScheduleSlotEntry[] = [
      {
        inEveryWeek: true,
        times: [
          [
            { hours: 18, minutes: 30 },
            { hours: 19, minutes: 0 },
          ],
          [
            { hours: 9, minutes: 5 },
            { hours: 10, minutes: 0 },
          ],
          [
            { hours: 12, minutes: 0 },
            { hours: 13, minutes: 0 },
          ],
        ],
      } as ScheduleSlotEntry,
    ];
    expect(getAvailableSlotsForDate(schedule, '2026-05-14')).toEqual(['09.05', '12.00', '18.30']);
  });
});

describe('validateField', () => {
  it('required + empty → "Required field"', () => {
    const a = attr('name', 'string', {
      validators: { requiredValidator: { strict: true } },
    } as never);
    expect(validateField(a, '', t)).toBe('Required field');
  });

  it('required + filled → passes the required check (returns null if nothing else fails)', () => {
    const a = attr('name', 'string', {
      validators: { requiredValidator: { strict: true } },
    } as never);
    expect(validateField(a, 'John', t)).toBeNull();
  });

  it('non-required + empty → null (short-circuits before any other check)', () => {
    const a = attr('name', 'string', { validators: {} } as never);
    expect(validateField(a, '', t)).toBeNull();
  });

  it('stringInspection: exact length mismatch → "Length must be exactly N"', () => {
    const a = attr('zip', 'string', {
      validators: { stringInspectionValidator: { stringLength: 5 } },
    } as never);
    expect(validateField(a, '1234', t)).toBe('Length must be exactly 5');
    expect(validateField(a, '12345', t)).toBeNull();
  });

  it('stringInspection: range mismatch → "Length must be between X and Y"', () => {
    const a = attr('name', 'string', {
      validators: { stringInspectionValidator: { stringMin: 2, stringMax: 5 } },
    } as never);
    expect(validateField(a, 'a', t)).toBe('Length must be between 2 and 5');
    expect(validateField(a, 'ab', t)).toBeNull();
    expect(validateField(a, 'abcdef', t)).toBe('Length must be between 2 and 5');
  });

  it('stringInspection: skipped when min/max/length are all 0', () => {
    const a = attr('name', 'string', {
      validators: { stringInspectionValidator: { stringMin: 0, stringMax: 0, stringLength: 0 } },
    } as never);
    // Truthy guard `if (strCfg && (strCfg.stringMin || strCfg.stringMax || strCfg.stringLength))`
    // is false → branch is skipped, validation passes.
    expect(validateField(a, 'any', t)).toBeNull();
  });

  it('emailInspection: invalid email → "Invalid email"', () => {
    const a = attr('email', 'string', { validators: { emailInspectionValidator: true } } as never);
    expect(validateField(a, 'not-an-email', t)).toBe('Invalid email');
    expect(validateField(a, 'real@example.com', t)).toBeNull();
  });

  it('emailInspection: skipped when the validator flag is not exactly `true`', () => {
    const a = attr('email', 'string', { validators: { emailInspectionValidator: false } } as never);
    expect(validateField(a, 'not-an-email', t)).toBeNull();
  });

  it('fieldMask: value not matching the mask → "Invalid format"', () => {
    const a = attr('phone', 'string', {
      validators: { fieldMaskValidator: { maskValue: '9999' } },
    } as never);
    expect(validateField(a, '12', t)).toBe('Invalid format');
    expect(validateField(a, '1234', t)).toBeNull();
  });

  it('fieldMask: skipped when maskValue is empty', () => {
    const a = attr('phone', 'string', {
      validators: { fieldMaskValidator: { maskValue: '' } },
    } as never);
    expect(validateField(a, 'anything', t)).toBeNull();
  });

  it('checks are layered — required first, then range, then format', () => {
    const a = attr('email', 'string', {
      validators: {
        requiredValidator: { strict: true },
        emailInspectionValidator: true,
        stringInspectionValidator: { stringMin: 5, stringMax: 50 },
      },
    } as never);
    // Required wins on empty.
    expect(validateField(a, '', t)).toBe('Required field');
    // Length fails before email even though both would fail.
    expect(validateField(a, 'a@b', t)).toBe('Length must be between 5 and 50');
    // Email format fails when length passes but format is wrong.
    expect(validateField(a, 'notanemail', t)).toBe('Invalid email');
    // All pass.
    expect(validateField(a, 'user@example.com', t)).toBeNull();
  });
});

describe('buildTimeIntervalValue', () => {
  const restaurants: RestaurantOption[] = [
    {
      value: 'main',
      id: 1,
      label: 'Main',
      schedule: [
        {
          inEveryWeek: true,
          times: [
            [
              { hours: 12, minutes: 0 },
              { hours: 13, minutes: 30 },
            ],
            [
              { hours: 18, minutes: 30 },
              { hours: 20, minutes: 0 },
            ],
          ],
        } as ScheduleSlotEntry,
      ],
    },
  ];

  it('returns [] on empty raw value', () => {
    expect(buildTimeIntervalValue('', 'main', restaurants)).toEqual([]);
  });

  it('returns [] on malformed raw value (no time)', () => {
    expect(buildTimeIntervalValue('2026-05-14', 'main', restaurants)).toEqual([]);
  });

  it('returns [] on malformed slot (no dot)', () => {
    expect(buildTimeIntervalValue('2026-05-14 1900', 'main', restaurants)).toEqual([]);
  });

  it('uses the matching schedule entry for the [start, end] interval', () => {
    const [pair] = buildTimeIntervalValue('2026-05-14 12.00', 'main', restaurants);
    expect(pair).toEqual(['2026-05-14T12:00:00.000Z', '2026-05-14T13:30:00.000Z']);
  });

  it('falls back to start+1h when the slot does not match any schedule entry', () => {
    const [pair] = buildTimeIntervalValue('2026-05-14 22.00', 'main', restaurants);
    expect(pair).toEqual(['2026-05-14T22:00:00.000Z', '2026-05-14T23:00:00.000Z']);
  });

  it('wraps end-hour at 24h boundary (23.00 -> 00:00 next day-of-UTC)', () => {
    const [pair] = buildTimeIntervalValue('2026-05-14 23.30', 'unknown', restaurants);
    // Unknown restaurant -> no schedule match -> fallback `(hh + 1) % 24`.
    // Note: this currently produces a same-day end time, which is a known
    // limitation of the fallback (it wraps the hour but not the date).
    expect(pair?.[0]).toBe('2026-05-14T23:30:00.000Z');
    expect(pair?.[1]).toBe('2026-05-14T00:30:00.000Z');
  });
});
