import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

import { validators } from '@/app/api/utils/validators';

import type { FormRow, Translate } from './reservationTypes';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';

export const RESTAURANT_MARKER = 'restaurant';
export const TIME_SLOT_MARKER = 'time_slot';
export const PREFERENCES_MARKER = 'user_preferences';

/**
 * isFullWidthAttr — attributes that should occupy a full row in the booking form (entity select,
 * multi-line text, date/time picker trigger, and the free-form preferences field rendered as a
 * textarea). Everything else is paired into two-column rows.
 *
 * @param   {IFormAttribute} attr - OneEntry form attribute.
 * @returns `true` when the attribute must render on its own row.
 */
export const isFullWidthAttr = (attr: IFormAttribute): boolean =>
  attr.type === 'entity' ||
  attr.type === 'text' ||
  attr.type === 'timeInterval' ||
  attr.marker === TIME_SLOT_MARKER ||
  attr.marker === PREFERENCES_MARKER;

/**
 * validateField — runs the OneEntry validators attached to a single attribute against the current
 * value and returns a localized error message, or `null` when the value passes every check.
 *
 * @param   {IFormAttribute} attr  - OneEntry form attribute carrying the `validators` map.
 * @param   {string}         value - Current field value (always a string in this form).
 * @param   {Translate}      t     - Dictionary lookup for the error message.
 * @returns Error string to display, or `null` when valid.
 */
export const validateField = (attr: IFormAttribute, value: string, t: Translate): string | null => {
  const v = (attr.validators ?? {}) as Record<string, unknown>;
  const required = (v.requiredValidator as { strict?: boolean } | undefined)?.strict === true;

  if (required && !validators.requiredValidator(value)) {
    return t('validation_required', 'Required field');
  }
  if (!value.length) return null;

  const strCfg = v.stringInspectionValidator as
    { stringMin?: number; stringMax?: number; stringLength?: number } | undefined;
  if (strCfg && (strCfg.stringMin || strCfg.stringMax || strCfg.stringLength)) {
    if (!validators.stringInspectionValidator(value, strCfg)) {
      const { stringMin, stringMax, stringLength } = strCfg;
      if (stringLength && stringLength > 0) {
        return t('validation_string_length', `Length must be exactly ${stringLength}`);
      }
      return t(
        'validation_string_range',
        `Length must be between ${stringMin ?? 0} and ${stringMax ?? 0}`
      );
    }
  }

  if (v.emailInspectionValidator === true && !validators.emailInspectionValidator(value)) {
    return t('validation_email', 'Invalid email');
  }

  const mask = v.fieldMaskValidator as { maskValue?: string } | undefined;
  if (mask?.maskValue && !validators.fieldMaskValidator(value, mask)) {
    return t('validation_mask', 'Invalid format');
  }

  return null;
};

/**
 * buildFormRows — walks the position-sorted attributes and groups them into form rows: full-width
 * fields get their own row; narrow fields are paired sequentially into two-column rows. Skips
 * `button` and `spam` (the latter is submitted invisibly).
 *
 * @param   {IFormAttribute[]} sortedAttrs - Attributes pre-sorted by `position`.
 * @returns Rows ready to render in document order.
 */
export const buildFormRows = (sortedAttrs: IFormAttribute[]): FormRow[] => {
  const rows: FormRow[] = [];
  let pending: IFormAttribute | null = null;
  for (const attr of sortedAttrs) {
    if (attr.type === 'button' || attr.type === 'spam') continue;
    if (isFullWidthAttr(attr)) {
      if (pending) {
        rows.push({ kind: 'pair', left: pending });
        pending = null;
      }
      rows.push({ kind: 'full', attr });
    } else if (pending) {
      rows.push({ kind: 'pair', left: pending, right: attr });
      pending = null;
    } else {
      pending = attr;
    }
  }
  if (pending) rows.push({ kind: 'pair', left: pending });
  return rows;
};

/**
 * getAvailableSlotsForDate — available `HH.MM` slot starts for a date, based on the restaurant schedule.
 *
 * @param   {ScheduleSlotEntry[] | undefined} schedule - Raw entries from `schedule.value`.
 * @param   {string}                          dateIso  - Selected date `yyyy-MM-dd`.
 * @returns Sorted list of slot labels (`HH.MM`).
 */
export const getAvailableSlotsForDate = (
  schedule: ScheduleSlotEntry[] | undefined,
  dateIso: string
): string[] => {
  if (!schedule || schedule.length === 0 || !dateIso) return [];
  const target = new Date(`${dateIso}T00:00:00.000Z`).getTime();
  const result = new Set<string>();
  for (const entry of schedule) {
    let applies = false;
    if (entry.inEveryWeek || entry.inEveryMonth) {
      applies = true;
    } else if (entry.dates && entry.dates.length === 2) {
      const start = new Date(entry.dates[0]).getTime();
      const end = new Date(entry.dates[1]).getTime();
      applies = target >= start && target <= end;
    }
    if (!applies || !entry.times) continue;
    for (const [from] of entry.times) {
      const hh = String(from.hours).padStart(2, '0');
      const mm = String(from.minutes).padStart(2, '0');
      result.add(`${hh}.${mm}`);
    }
  }
  return [...result].sort();
};

/**
 * buildTimeIntervalValue — converts the selected slot (`yyyy-MM-dd HH.MM`) into the OneEntry `timeInterval` shape.
 *
 * @param   {string}              raw             - Value of the `time_slot` field.
 * @param   {string | undefined}  restaurantValue - Current `restaurant` value (page url).
 * @param   {RestaurantOption[]}  restaurants     - Available restaurant options.
 * @returns Intervals ready to submit (one entry); empty array on invalid input.
 */
export const buildTimeIntervalValue = (
  raw: string,
  restaurantValue: string | undefined,
  restaurants: RestaurantOption[]
): Array<[string, string]> => {
  if (!raw) return [];
  const [dateIso, slotStr] = raw.split(' ');
  if (!dateIso || !slotStr) return [];
  const [hhStr, mmStr] = slotStr.split('.');
  if (!hhStr || !mmStr) return [];
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return [];

  const makeIso = (h: number, m: number): string => {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  };

  const schedule = restaurants.find(r => r.value === restaurantValue)?.schedule ?? [];
  const target = new Date(`${dateIso}T00:00:00.000Z`).getTime();
  for (const entry of schedule) {
    let applies = false;
    if (entry.inEveryWeek || entry.inEveryMonth) applies = true;
    else if (entry.dates && entry.dates.length === 2) {
      const start = new Date(entry.dates[0]).getTime();
      const end = new Date(entry.dates[1]).getTime();
      applies = target >= start && target <= end;
    }
    if (!applies || !entry.times) continue;
    for (const [from, to] of entry.times) {
      if (from.hours === hh && from.minutes === mm) {
        return [[makeIso(from.hours, from.minutes), makeIso(to.hours, to.minutes)]];
      }
    }
  }

  return [[makeIso(hh, mm), makeIso((hh + 1) % 24, mm)]];
};

/**
 * resolveInputType — maps a OneEntry form attribute type + marker to a native HTML input `type`.
 *
 * @param   {string} type   - OneEntry attribute `type`.
 * @param   {string} marker - Attribute marker used as a heuristic.
 * @returns HTML input type (`number` / `email` / `tel` / `password` / `text`).
 */
export const resolveInputType = (type: string, marker: string): string => {
  if (type === 'integer' || type === 'real' || type === 'float') return 'number';
  if (marker.includes('email')) return 'email';
  if (marker.includes('phone') || marker.includes('tel')) return 'tel';
  if (marker.includes('password')) return 'password';
  return 'text';
};

/**
 * formatBookingSummary — formats the booking summary as `DD.MM.YY HH.MM N person`.
 *
 * @param   {Record<string, string>} values - Form field values keyed by marker.
 * @returns Summary string for the success screen (parts may be omitted when missing).
 */
export const formatBookingSummary = (values: Record<string, string>): string => {
  const slot = values[TIME_SLOT_MARKER] ?? '';
  const [dateIso, time] = slot.split(' ');
  let datePart = '';
  if (dateIso) {
    const [yyyy, mm, dd] = dateIso.split('-');
    if (yyyy && mm && dd) datePart = `${dd}.${mm}.${yyyy.slice(2)}`;
  }
  const timePart = time ?? '';
  const peopleRaw = values['people_count'] ?? '';
  const peopleNum = Number(peopleRaw);
  const peoplePart = !Number.isNaN(peopleNum) && peopleNum > 0 ? `${peopleNum} person` : '';
  return [datePart, timePart, peoplePart].filter(Boolean).join(' ');
};
