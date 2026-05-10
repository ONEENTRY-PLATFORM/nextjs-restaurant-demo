'use client';

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import ChevronDownIcon from '@/components/icons/chevron-down';

/** A single restaurant schedule interval from OneEntry (attribute `schedule`, type `timeInterval`). */
export type ScheduleSlotEntry = {
  dates?: [string, string];
  times?: Array<[{ hours: number; minutes: number }, { hours: number; minutes: number }]>;
  inEveryWeek?: boolean;
  inEveryMonth?: boolean;
};

export type RestaurantOption = {
  value: string;
  label: string;
  // Numeric restaurant page id: the `restaurant` field has type `entity` and expects `value: [<numericPageId>]`.
  id: number;
  // Schedule — passed to the TimePicker so only available slots are shown.
  schedule?: ScheduleSlotEntry[];
};

/**
 * RestaurantSelect — custom dropdown following the `.custom-select` pattern from static-html.
 *
 * @param   {object}                  props             - Component props.
 * @param   {RestaurantOption[]}      props.options     - Available restaurant options.
 * @param   {string}                  props.value       - Currently selected value.
 * @param   {(v: string) => void}     props.onChange    - Change handler that receives the new value.
 * @param   {string}                  [props.placeholder] - Trigger placeholder text.
 * @returns JSX of the dropdown.
 */
const RestaurantSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Restaurant choosing',
}: {
  options: RestaurantOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): JSX.Element => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(o => o.value === value)?.label;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={ref} className="custom-select relative mt-6.25 w-full">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full cursor-pointer items-center justify-between rounded-md border-none bg-custom_transparent px-4 py-1.25 text-lg text-brand backdrop-blur-md"
      >
        <span>{selectedLabel ?? placeholder}</span>
        <ChevronDownIcon
          className={'transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md bg-custom_transparent backdrop-blur-md"
        >
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="cursor-pointer px-4 py-2 text-brand hover:bg-white/20"
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default RestaurantSelect;
