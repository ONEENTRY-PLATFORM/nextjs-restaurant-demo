'use client';

import type { JSX } from 'react';

import StarCardIcon from '@/components/icons/star-card';

/**
 * Компонент звёздного рейтинга — отображает заполненные звёзды для данного
 * значения от 5. Когда передан `onChange`, компонент становится интерактивным
 * (клик по звезде задаёт рейтинг), иначе — только для отображения.
 * @param   {object}                  props          - Пропсы компонента.
 * @param   {number}                  props.value    - Текущий рейтинг (0–5).
 * @param   {(v: number) => void}     [props.onChange] - Опциональный обработчик изменения.
 * @param   {number}                  [props.size]     - Размер звезды в px (по умолчанию 16).
 * @returns {JSX.Element}                            JSX строки звёзд.
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
