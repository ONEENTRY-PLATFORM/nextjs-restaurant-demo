'use client';

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Кнопка Create account
 */
const CreateAccountButton = ({
  title = 'Create account',
}: {
  title: string;
}) => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => {
        setOpen(true);
        setComponent('SignUpForm');
      }}
      type="button"
      className="rounded-[10px] w-full h-14 font-semibold text-[17px] text-center flex justify-center items-center gap-6.25 text-[#ec722b] bg-transparent border border-[#ec722b] hover_btn_white"
    >
      {title}
    </button>
  );
};

export default CreateAccountButton;
