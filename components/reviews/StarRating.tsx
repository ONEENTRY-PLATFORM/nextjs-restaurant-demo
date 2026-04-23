'use client';

import type { JSX } from 'react';

/**
 * Star rating component — displays filled stars for the given value out of 5.
 * When `onChange` is provided the component becomes interactive (click a star
 * to set rating), otherwise it is a read-only display.
 * @param   {object}                  props          - Component props.
 * @param   {number}                  props.value    - Current rating (0–5).
 * @param   {(v: number) => void}     [props.onChange] - Optional change handler.
 * @param   {number}                  [props.size]     - Star size in px (default 16).
 * @returns {JSX.Element}                            Star row JSX.
 */
const StarRating = ({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}): JSX.Element => {
  const stars = [1, 2, 3, 4, 5];
  const isInteractive = Boolean(onChange);

  return (
    <div
      className="flex gap-1"
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${value} out of 5`}
    >
      {stars.map((n) => {
        const filled = n <= Math.round(value);
        const Tag = isInteractive ? 'button' : 'span';
        return (
          <Tag
            key={n}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => onChange?.(n) : undefined}
            aria-label={
              isInteractive ? `${n} star${n > 1 ? 's' : ''}` : undefined
            }
            className="inline-flex"
            style={{ width: size, height: size }}
          >
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              aria-hidden="true"
            >
              <path
                d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.57L12 17.6l-5.9 3.1 1.13-6.57L2.45 9.46l6.6-.96L12 2.5z"
                fill={filled ? '#ec722b' : 'rgba(223,233,249,0.25)'}
                stroke="#ec722b"
                strokeWidth="1"
              />
            </svg>
          </Tag>
        );
      })}
    </div>
  );
};

export default StarRating;
