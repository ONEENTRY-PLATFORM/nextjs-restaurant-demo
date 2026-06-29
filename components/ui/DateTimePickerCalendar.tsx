'use client';

import type { JSX } from 'react';

import ChevronMiniLeftIcon from '@/components/icons/chevron-mini-left.svg';
import ChevronMiniRightIcon from '@/components/icons/chevron-mini-right.svg';
import { type DayCell, MONTH_NAMES, WEEK } from '@/components/ui/dateTimePickerUtils';

type DateTimePickerCalendarProps = {
  grid: DayCell[];
  selectedDate: string;
  minDate?: string | undefined;
  month: number;
  year: number;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

/**
 * DateTimePickerCalendar — month grid (step 1) of the date/time picker.
 *
 * @param   {DateTimePickerCalendarProps} props              - Component props.
 * @param   {DayCell[]}                   props.grid         - 6×7 day cells for the visible month.
 * @param   {string}                      props.selectedDate - Currently selected date in `yyyy-MM-dd`.
 * @param   {string}                      [props.minDate]    - Minimum selectable date in `yyyy-MM-dd`.
 * @param   {number}                      props.month        - Zero-based visible month index.
 * @param   {number}                      props.year         - Visible calendar year.
 * @param   {(iso: string) => void}       props.onSelectDate - Called with the picked day's `iso`.
 * @param   {() => void}                  props.onPrevMonth  - Steps the grid back one month.
 * @param   {() => void}                  props.onNextMonth  - Steps the grid forward one month.
 * @returns JSX of the calendar step.
 */
const DateTimePickerCalendar = ({
  grid,
  selectedDate,
  minDate,
  month,
  year,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: DateTimePickerCalendarProps): JSX.Element => (
  <div className="mx-auto w-full max-w-87.5">
    <div className="grid grid-cols-7">
      {WEEK.map(w => (
        <div key={w} data-anim="dt-item" className="calend_mon">
          {w}
        </div>
      ))}
      {grid.map(cell => {
        const disabled = (minDate && cell.iso < minDate) || cell.monthOffset !== 0;
        // Suppress the active highlight on disabled cells so a pre-selected past date
        // doesn't appear "selected but dimmed" — past dates should look unambiguously
        // non-selectable, even if `selectedDate` still points at one (Apply is blocked
        // by `canApply` elsewhere).
        const active = cell.iso === selectedDate && cell.monthOffset === 0 && !disabled;
        return (
          <button
            key={cell.iso + cell.monthOffset}
            type="button"
            data-anim="dt-item"
            data-disabled={disabled || undefined}
            disabled={disabled}
            onClick={() => onSelectDate(cell.iso)}
            className={
              'calend_days ' +
              (active ? 'bg-brand text-white font-bold ' : '') +
              (disabled ? 'opacity-40 pointer-events-none ' : '')
            }
          >
            {String(cell.day).padStart(2, '0')}
          </button>
        );
      })}
    </div>
    <div className="mt-4 mb-5 flex items-center justify-around">
      <button type="button" onClick={onPrevMonth} aria-label="Previous month" className="group">
        <ChevronMiniLeftIcon />
      </button>
      <div className="flex gap-3.75">
        <h2 className="text-xl font-semibold text-brand">{MONTH_NAMES[month]}</h2>
        <h3 className="text-xl font-light text-brand">{year}</h3>
      </div>
      <button type="button" onClick={onNextMonth} aria-label="Next month" className="group">
        <ChevronMiniRightIcon />
      </button>
    </div>
  </div>
);

export default DateTimePickerCalendar;
