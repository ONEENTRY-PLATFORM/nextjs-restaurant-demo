'use client';

import type { JSX } from 'react';

import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * Shared "X" close button used in the corner of every popup
 * (`ProfilePopup`, `FavoritesPopup`, `CartWizard`, etc.) — circular
 * `border-paper` button with a `hover-target` X glyph that turns brand-orange
 * on hover. Layout (visibility per breakpoint, top offset) is controlled by
 * the caller via `className`.
 * @param   {object}      props             - Button props.
 * @param   {() => void}  props.onClose     - Click handler (e.g. `setTransition('close')`).
 * @param   {string}      [props.ariaLabel] - Accessible label, defaults to `'Close'`.
 * @param   {string}      [props.className] - Extra utility classes (visibility, margins).
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
