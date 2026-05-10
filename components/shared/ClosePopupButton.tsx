'use client';

import type { JSX } from 'react';

import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * ClosePopupButton — shared "X" close button in the corner of every popup.
 *
 * @param   {object}      props             - Component props.
 * @param   {() => void}  props.onClose     - Click handler that closes the popup.
 * @param   {string}      [props.ariaLabel] - Accessible label (defaults to `'Close'`).
 * @param   {string}      [props.className] - Additional utility classes merged onto the button.
 * @returns JSX of the rounded close button with hover-to-brand border.
 */
const ClosePopupButton = ({
  onClose,
  ariaLabel = 'Close',
  className = '',
}: {
  onClose: () => void;
  ariaLabel?: string;
  className?: string;
}): JSX.Element => {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={ariaLabel}
      className={`group flex h-11.5 w-11.5 items-center justify-center rounded-full border border-paper hover:border-brand ${className}`}
    >
      <CloseXBoldIcon className="hover-target" />
    </button>
  );
};

export default ClosePopupButton;
