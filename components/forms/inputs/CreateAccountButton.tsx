'use client';

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * CreateAccountButton — "Create account" CTA that opens the popup with SignUpForm.
 *
 * @param   {object} props       - Component props.
 * @param   {string} props.title - Button label (defaults to `'Create account'`).
 * @returns JSX of the outlined create-account button.
 */
const CreateAccountButton = ({ title = 'Create account' }: { title: string }) => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  return (
    <button
      onClick={() => {
        setOpen(true);
        setComponent('SignUpForm');
      }}
      type="button"
      className="rounded-panel w-full h-14 font-semibold text-[17px] text-center flex justify-center items-center gap-6.25 text-brand bg-transparent border border-brand hover_btn_brand active:bg-brand-soft-active active:text-white disabled:border-ink disabled:text-ink"
    >
      {title}
    </button>
  );
};

export default CreateAccountButton;
