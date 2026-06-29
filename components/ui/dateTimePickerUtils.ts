import { toLocalIsoDate } from '@/app/utils/formatDate';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export type DayCell = {
  day: number;
  monthOffset: -1 | 0 | 1;
  iso: string;
};

/**
 * buildMonthGrid — builds a rectangular 6×7 day grid for the month, padded with tails of neighboring months.
 *
 * @param   {number} year  - Calendar year.
 * @param   {number} month - Zero-based month index.
 * @returns Array of 42 day cells (previous-month tail + current month + next-month head).
 */
export const buildMonthGrid = (year: number, month: number): DayCell[] => {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = firstDow - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    cells.push({
      day,
      monthOffset: -1,
      iso: toLocalIsoDate(new Date(year, month - 1, day)),
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      monthOffset: 0,
      iso: toLocalIsoDate(new Date(year, month, day)),
    });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      day: nextDay,
      monthOffset: 1,
      iso: toLocalIsoDate(new Date(year, month + 1, nextDay)),
    });
    nextDay += 1;
  }
  return cells;
};

/**
 * formatHour — formats a 24h hour as `HH.00`.
 *
 * @param   {number} h - Hour (0–23).
 * @returns Slot label string.
 */
export const formatHour = (h: number): string => `${String(h).padStart(2, '0')}.00`;
