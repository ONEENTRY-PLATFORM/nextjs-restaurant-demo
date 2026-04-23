'use client';

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

export type RestaurantOption = {
  value: string;
  label: string;
};

/**
 * Custom dropdown matching the static-html `.custom-select` pattern.
 * Renders orange trigger + panel with options; closes on outside click.
 * @param   {object}                  props          - Component props.
 * @param   {RestaurantOption[]}      props.options  - Available restaurant options.
 * @param   {string}                  props.value    - Currently selected value.
 * @param   {(v: string) => void}     props.onChange - Change handler.
 * @param   {string}                  [props.placeholder] - Trigger placeholder text.
 * @returns {JSX.Element}                            Dropdown JSX.
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
  const selectedLabel = options.find((o) => o.value === value)?.label;

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
    <div ref={ref} className="custom-select relative mt-[25px] w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between rounded-md border-none bg-custom_transparent px-4 py-[5px] text-lg text-brand backdrop-blur-md"
      >
        <span>{selectedLabel ?? placeholder}</span>
        <svg
          width="15"
          height="10"
          viewBox="0 0 15 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={
            'transition-transform duration-200 ' + (open ? 'rotate-180' : '')
          }
          aria-hidden="true"
        >
          <path
            d="M2 2L7.5 8L13 2"
            stroke="#EC722B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md bg-custom_transparent backdrop-blur-md"
        >
          {options.map((o) => (
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
