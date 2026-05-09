'use client';

import type { JSX } from 'react';

import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * ClosePopupButton — shared "X" close button in the corner of every popup.
 * @param   {object}      props             - Props.
 * @param   {() => void}  props.onClose     - Click handler.
 * @param   {string}      [props.ariaLabel] - Accessible label, defaults to `'Close'`.
 * @param   {string}      [props.className] - Additional utility classes.
 * @returns {JSX.Element}                   Button JSX.
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
