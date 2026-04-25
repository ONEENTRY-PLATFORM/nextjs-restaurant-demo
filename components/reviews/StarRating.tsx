'use client';

import type { JSX } from 'react';

import StarCardIcon from '@/components/icons/star-card';

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
            <StarCardIcon size={size} filled={filled} />
          </Tag>
        );
      })}
    </div>
  );
};

export default StarRating;
