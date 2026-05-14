'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * ClosePopupButton — shared "X" close button in the corner of every popup.
 *
 * @param   {object}      props             - Component props.
 * @param   {() => void}  props.onClose     - Click handler that closes the popup.
 * @param   {string}      [props.ariaLabel] - Accessible label override; defaults to the `close_label` dictionary entry.
 * @param   {string}      [props.className] - Additional utility classes merged onto the button.
 * @returns JSX of the rounded close button with hover-to-brand border.
 */
const ClosePopupButton = ({
  onClose,
  ariaLabel,
  className = '',
}: {
  onClose: () => void;
  ariaLabel?: string;
  className?: string;
}): JSX.Element => {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={ariaLabel ?? t('close_label', 'Close')}
      className={`group flex h-11.5 w-11.5 items-center justify-center rounded-full border border-paper transition-colors duration-200 hover:border-brand active:border-brand ${className}`}
    >
      <CloseXBoldIcon className="hover-target" />
    </button>
  );
};

export default ClosePopupButton;
