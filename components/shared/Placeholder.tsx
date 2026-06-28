import type { JSX } from 'react';

import LogoIcon from '@/components/icons/logo';

/**
 * Placeholder — fallback for a missing image, showing the project logo on a tinted card.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      [props.className] - Additional className merged onto the wrapper.
 * @returns JSX of the placeholder card.
 */
const Placeholder = ({ className }: { className?: string }): JSX.Element => {
  return (
    <div
      className={
        'relative flex size-full flex-col items-center justify-center overflow-hidden rounded-card bg-ink/30 text-paper/40 ' +
        (className ?? '')
      }
    >
      <LogoIcon className="h-auto w-1/2 max-w-32" />
    </div>
  );
};

export default Placeholder;
