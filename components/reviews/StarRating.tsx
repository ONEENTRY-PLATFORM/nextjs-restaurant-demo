'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import StarCardIcon from '@/components/icons/star-card';

/**
 * StarRating — renders filled stars for a value out of 5; interactive when `onChange` is provided.
 *
 * @param   {object}                 props            - Component props.
 * @param   {number}                 props.value      - Current rating (0–5).
 * @param   {(v: number) => void}    [props.onChange] - Optional change handler that receives the chosen rating.
 * @param   {number}                 [props.size]     - Star size in px (defaults to 16).
 * @returns JSX of the star row.
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
  const t = useT();
  const stars = [1, 2, 3, 4, 5];
  const isInteractive = Boolean(onChange);
  const ratingPrefix = t('rating_prefix', 'Rating:');
  const outOfText = t('rating_out_of_text', 'out of');

  return (
    <div
      className="flex gap-1"
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`${ratingPrefix} ${value} ${outOfText} 5`}
    >
      {stars.map(n => {
        const filled = n <= Math.round(value);
        const Tag = isInteractive ? 'button' : 'span';
        return (
          <Tag
            key={n}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => onChange?.(n) : undefined}
            aria-label={isInteractive ? `${n} star${n > 1 ? 's' : ''}` : undefined}
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
