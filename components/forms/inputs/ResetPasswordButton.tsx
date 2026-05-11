'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * ResetPasswordButton — text-style button that opens the popup with `ForgotPasswordForm`.
 *
 * @param   {object}     props           - Component props.
 * @param   {string}     props.title     - Button label.
 * @param   {() => void} [props.onClick] - Optional click handler that replaces the default drawer navigation (used by the reservation popup to switch to its inline forgot-password sub-step).
 * @returns JSX of the underlined reset-password button.
 */
const ResetPasswordButton = ({
  title,
  onClick,
}: {
  title: string;
  onClick?: (() => void) | undefined;
}): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  const handleClick =
    onClick ??
    (() => {
      setOpen(true);
      setComponent('ForgotPasswordForm');
    });

  return (
    <button
      onClick={handleClick}
      type="button"
      className="w-auto font-semibold text-xl text-brand underline cursor-pointer"
    >
      {title}
    </button>
  );
};

export default ResetPasswordButton;
