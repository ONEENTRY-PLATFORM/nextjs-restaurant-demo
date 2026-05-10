'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * ResetPasswordButton — text-style button that opens the popup with `ForgotPasswordForm`.
 *
 * @param   {object} props       - Component props.
 * @param   {string} props.title - Button label.
 * @returns {JSX.Element}          JSX of the underlined reset-password button.
 */
const ResetPasswordButton = ({ title }: { title: string }): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => {
        setOpen(true);
        setComponent('ForgotPasswordForm');
      }}
      type="button"
      className="w-auto font-semibold text-xl text-brand underline cursor-pointer"
    >
      {title}
    </button>
  );
};

export default ResetPasswordButton;
