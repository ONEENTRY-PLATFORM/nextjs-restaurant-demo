'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Reset password button
 */
const ResetPasswordButton = ({ title }: {
  title: string;
}): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => {
        setOpen(true);
        setComponent('ForgotPasswordForm');
      }}
      type="button"
      className="w-auto font-semibold text-[20px] text-[#ec722b] underline cursor-pointer"
    >
      {title}
    </button>
  );
};

export default ResetPasswordButton;
