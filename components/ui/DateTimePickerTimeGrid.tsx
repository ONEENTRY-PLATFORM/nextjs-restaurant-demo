'use client';

import type { JSX } from 'react';

type DateTimePickerTimeGridProps = {
  slots: string[];
  selectedTime: string;
  isSlotPast: (slot: string) => boolean;
  onSelectTime: (slot: string) => void;
  noTimeText: string;
};

/**
 * DateTimePickerTimeGrid — time-slot grid (step 2) of the date/time picker.
 *
 * @param   {DateTimePickerTimeGridProps}   props              - Component props.
 * @param   {string[]}                      props.slots        - Available slot labels in `HH.MM`.
 * @param   {string}                        props.selectedTime - Currently selected slot label.
 * @param   {(slot: string) => boolean}     props.isSlotPast   - Whether a slot is in the past for the selected date.
 * @param   {(slot: string) => void}        props.onSelectTime - Called with the picked slot label.
 * @param   {string}                        props.noTimeText   - Empty-state text when no slots are available.
 * @returns JSX of the time step.
 */
const DateTimePickerTimeGrid = ({
  slots,
  selectedTime,
  isSlotPast,
  onSelectTime,
  noTimeText,
}: DateTimePickerTimeGridProps): JSX.Element => (
  <div className="mx-auto w-full max-w-87.5">
    {slots.length === 0 ? (
      <p className="py-5 text-center text-base text-paper/80">{noTimeText}</p>
    ) : (
      <div className="grid grid-cols-4 gap-2.5">
        {slots.map(slot => {
          const past = isSlotPast(slot);
          // Suppress active highlight on past slots: a pre-selected past time (e.g. 10:00
          // when it's already 17:00) would otherwise render highlighted-but-dimmed and
          // look picked. Apply is also blocked via `canApply`.
          const active = slot === selectedTime && !past;
          return (
            <button
              key={slot}
              type="button"
              data-anim="dt-item"
              data-disabled={past || undefined}
              disabled={past}
              onClick={() => onSelectTime(slot)}
              className={
                'service_time ' +
                (active ? 'border-brand text-brand font-extrabold ' : '') +
                (past ? 'opacity-40 pointer-events-none ' : '')
              }
            >
              {slot}
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default DateTimePickerTimeGrid;
