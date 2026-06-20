import { ASAP_INTERVAL_MIN, type DeliveryMode } from './constants';

/**
 * Delivery time-slot schedule derived from the `delivery_time` (type `timeInterval`) form attribute.
 *
 * OneEntry does NOT expose the slots on `attribute.value` (as the generic create-checkout skill
 * assumes). They live on `attribute.localizeInfos.intervals[]`, where each interval carries a
 * pre-flattened `timeIntervals: [[startISO, endISO], …]` list plus weekly/monthly recurrence flags.
 * The flattened dates are a materialised one-year window anchored at schedule-creation time, so they
 * go stale — we therefore read only the *time-of-day* pattern (UTC start/end) and the set of covered
 * weekdays, then project them onto upcoming dates at render time.
 */
export type DeliverySlot = {
  /** Slot start as minutes from UTC midnight. */
  startMin: number;
  /** Slot end as minutes from UTC midnight. */
  endMin: number;
  /** Display/selection label in `HH.MM` (dot-separated, matches the schedule string format). */
  label: string;
};

export type DeliverySchedule = {
  /** Distinct slots for a covered day, sorted by start time. */
  slots: DeliverySlot[];
  /** UTC weekdays (0=Sun … 6=Sat) that have slots; empty means every day. */
  weekdays: Set<number>;
  /** Whether the form actually carried parseable slot data. */
  hasData: boolean;
};

type HourMinute = { hours?: number; minutes?: number };

type RawTimeInterval = {
  range?: [string, string];
  intervals?: Array<{ start?: HourMinute; end?: HourMinute; period?: number }>;
  timeIntervals?: Array<[string, string]>;
  inEveryWeek?: boolean;
  inEveryMonth?: boolean;
  inEveryYears?: boolean;
};

/** `delivery_time` attribute shape we read the schedule from (loosely typed — SDK marks it `unknown`). */
export type TimeIntervalAttribute = {
  type?: string;
  localizeInfos?: { intervals?: RawTimeInterval[] };
};

const MINUTES_IN_DAY = 24 * 60;

/**
 * minutesToLabel — formats minutes-from-midnight as a `HH.MM` label.
 *
 * @param   {number} min - Minutes from UTC midnight (0–1439).
 * @returns `HH.MM` label string.
 */
const minutesToLabel = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
};

/**
 * parseDeliverySchedule — extracts the recurring slot pattern from the `delivery_time` form attribute.
 *
 * Reads `localizeInfos.intervals[]`: prefers each interval's pre-flattened `timeIntervals` (deriving
 * distinct UTC time-of-day slots and covered weekdays), and falls back to the `intervals[].intervals`
 * `{ start, end, period }` template when no flattened list is present. Per-date `external` overrides
 * are intentionally ignored — the base recurring pattern drives the picker.
 *
 * @param   {TimeIntervalAttribute} [attr] - The `delivery_time` form attribute (or undefined).
 * @returns Parsed {@link DeliverySchedule} (`hasData: false` when nothing parseable is found).
 */
export const parseDeliverySchedule = (attr?: TimeIntervalAttribute): DeliverySchedule => {
  const intervals = attr?.localizeInfos?.intervals;
  const empty: DeliverySchedule = { slots: [], weekdays: new Set(), hasData: false };
  if (!Array.isArray(intervals) || intervals.length === 0) return empty;

  const slotByStart = new Map<number, number>(); // startMin -> endMin
  const weekdays = new Set<number>();

  for (const interval of intervals) {
    const flattened = Array.isArray(interval?.timeIntervals) ? interval.timeIntervals : [];
    if (flattened.length > 0) {
      for (const pair of flattened) {
        if (!Array.isArray(pair) || pair.length !== 2) continue;
        const start = new Date(pair[0]);
        const end = new Date(pair[1]);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
        const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
        let endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
        if (endMin <= startMin) endMin = Math.min(MINUTES_IN_DAY, startMin + 15);
        if (!slotByStart.has(startMin)) slotByStart.set(startMin, endMin);
        weekdays.add(start.getUTCDay());
      }
      continue;
    }
    // Fallback: generate slots from the time-of-day template when no flattened list exists.
    const templates = Array.isArray(interval?.intervals) ? interval.intervals : [];
    for (const tpl of templates) {
      const startMin = (tpl?.start?.hours ?? 0) * 60 + (tpl?.start?.minutes ?? 0);
      const endBound = (tpl?.end?.hours ?? 0) * 60 + (tpl?.end?.minutes ?? 0);
      const period = tpl?.period && tpl.period > 0 ? tpl.period : 15;
      for (let s = startMin; s + period <= endBound; s += period) {
        if (!slotByStart.has(s)) slotByStart.set(s, s + period);
      }
    }
  }

  if (slotByStart.size === 0) return empty;

  const slots: DeliverySlot[] = [...slotByStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([startMin, endMin]) => ({ startMin, endMin, label: minutesToLabel(startMin) }));

  // A pattern covering all 7 weekdays = every day; keep the empty set to mean "no weekday restriction".
  const weekdayFilter = weekdays.size >= 7 ? new Set<number>() : weekdays;

  return { slots, weekdays: weekdayFilter, hasData: true };
};

/**
 * weekdayOfIso — UTC weekday of a `yyyy-MM-dd` calendar date (parsed at noon UTC to avoid tz drift).
 *
 * @param   {string} dateIso - Date in `yyyy-MM-dd`.
 * @returns Weekday index (0=Sun … 6=Sat), or `-1` when the input is unparseable.
 */
const weekdayOfIso = (dateIso: string): number => {
  const d = new Date(`${dateIso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? -1 : d.getUTCDay();
};

/**
 * makeGetSlots — builds the `getSlots(dateIso)` callback consumed by `DateTimePickerSheet`.
 *
 * Returns the schedule's slot labels for any date whose weekday is covered, otherwise an empty list
 * (the picker then shows its "no slots" empty state). Returns `undefined` when the form carried no
 * slot data, so the caller can omit the prop and leave the picker on its default behaviour.
 *
 * @param   {DeliverySchedule} schedule - Parsed delivery schedule.
 * @returns `(dateIso: string) => string[]`, or `undefined` when there is no slot data.
 */
export const makeGetSlots = (
  schedule: DeliverySchedule
): ((dateIso: string) => string[]) | undefined => {
  if (!schedule.hasData) return undefined;
  return (dateIso: string): string[] => {
    if (schedule.weekdays.size > 0 && !schedule.weekdays.has(weekdayOfIso(dateIso))) return [];
    return schedule.slots.map(s => s.label);
  };
};

/**
 * buildDeliveryTimeInterval — value of `delivery_time` (type `timeInterval`) as `[[startISO, endISO]]`.
 *
 * For `asap` it returns a `now … now + ASAP_INTERVAL_MIN` window. For `scheduled` it resolves the
 * chosen `DD.MM.YY HH.MM` against the form schedule's slots (UTC time-of-day), so the value mirrors an
 * actual available slot rather than free-form input. The chosen wall-clock is stored as UTC to match
 * how bookings are read back (`getUTCHours`).
 *
 * @param   {DeliveryMode}       mode         - Delivery mode (`asap` | `scheduled`).
 * @param   {string}             scheduledRaw - Raw `DD.MM.YY HH.MM` schedule string when `mode === 'scheduled'`.
 * @param   {DeliverySchedule}   [schedule]   - Parsed schedule used to resolve the slot's end time.
 * @returns `[[startISO, endISO]]` interval, or `null` when the input cannot be parsed.
 */
export const buildDeliveryTimeInterval = (
  mode: DeliveryMode,
  scheduledRaw: string,
  schedule?: DeliverySchedule
): [[string, string]] | null => {
  if (mode === 'asap') {
    const start = new Date();
    const end = new Date(start.getTime() + ASAP_INTERVAL_MIN * 60 * 1000);
    return [[start.toISOString(), end.toISOString()]];
  }
  const m = scheduledRaw.match(/^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yy, hh, min] = m;
  const startMin = Number(hh) * 60 + Number(min);
  const slot = schedule?.slots.find(s => s.startMin === startMin);
  const durationMin = slot ? slot.endMin - slot.startMin : 15;
  const start = new Date(
    Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  );
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return [[start.toISOString(), end.toISOString()]];
};
