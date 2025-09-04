'use client';

import type { FC } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

interface CreateAccountButtonProps {
  title: string;
}

/**
 * Create account button
 * @param title
 *
 * @returns Create account button
 */
const CreateAccountButton: FC<CreateAccountButtonProps> = ({ title }) => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => {
        setOpen(true);
        setComponent('SignUpForm');
      }}
      type="button"
      className="rounded-[10px] w-full h-[56px] font-semibold text-[17px] text-center flex justify-center items-center gap-[25px] text-[#ec722b] bg-transparent border border-[#ec722b] mt-[50px] hover_btn_white"
    >
      {title || 'Create account'}
    </button>
  );
};

export default CreateAccountButton;
