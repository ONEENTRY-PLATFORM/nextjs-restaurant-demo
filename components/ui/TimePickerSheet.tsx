'use client';

import type { JSX } from 'react';
import { useState } from 'react';

type TimePickerSheetProps = {
  value?: string;
  onApply: (time: string) => void;
  onClose?: () => void;
  /** 24h range [fromHour, toHour], inclusive. Defaults to [10, 21]. */
  range?: [number, number];
  /** Step in hours between slots. Defaults to 1. */
  step?: 1 | 2;
};

/**
 * Format an hour number (0–23) as `HH.00` per the static-html `service_time`
 * display convention.
 * @param   {number} h - Hour 0–23.
 * @returns {string}   Label like `"10.00"`.
 */
const formatHour = (h: number): string => `${String(h).padStart(2, '0')}.00`;

/**
 * Fixed bottom-sheet time picker — replicates `service_time.html`.
 * Uses `.service_time` utility class from `app/styles/main.css`.
 * @param   {TimePickerSheetProps} props - Component props.
 * @returns {JSX.Element}                Sheet JSX.
 */
const TimePickerSheet = ({
  value,
  onApply,
  onClose,
  range = [10, 21],
  step = 1,
}: TimePickerSheetProps): JSX.Element => {
  const [selected, setSelected] = useState<string>(value ?? '');

  const slots: string[] = [];
  for (let h = range[0]; h <= range[1]; h += step) {
    slots.push(formatHour(h));
  }

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full rounded-tl-[20px] rounded-tr-[20px] bg-[rgba(76,77,86,0.8)] px-5 pt-7.25 backdrop-blur-[10px]">
      <div className="mx-auto max-w-77.5 bg-transparent">
        <div className="grid grid-cols-4 gap-2.5">
          {slots.map((slot) => {
            const active = slot === selected;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelected(slot)}
                className={
                  'service_time ' +
                  (active ? 'border-brand text-brand font-extrabold ' : '')
                }
              >
                {slot}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!selected}
            onClick={() => onApply(selected)}
            className="mx-auto block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
          >
            Apply
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] border border-paper px-3.75 py-1.25 font-bold text-[20px] text-paper hover_btn_white"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
      <div className="h-25 border-none bg-transparent" />
    </div>
  );
};

export default TimePickerSheet;
