'use client';

import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * CreateAccountButton — "Create account" CTA that opens the popup with SignUpForm.
 *
 * @param   {object}     props         - Component props.
 * @param   {string}     props.title   - Button label (defaults to `'Create account'`).
 * @param   {() => void} [props.onClick] - Optional click handler that replaces the default drawer navigation (used by the reservation popup to switch to its inline sign-up sub-step).
 * @returns JSX of the outlined create-account button.
 */
const CreateAccountButton = ({
  title = 'Create account',
  onClick,
}: {
  title: string;
  onClick?: (() => void) | undefined;
}) => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);

  const handleClick =
    onClick ??
    (() => {
      setOpen(true);
      setComponent('SignUpForm');
    });

  return (
    <button
      onClick={handleClick}
      type="button"
      className="rounded-panel w-full h-14 font-semibold text-[17px] text-center flex justify-center items-center gap-6.25 text-brand bg-transparent border border-brand hover_btn_brand active:bg-brand-soft-active active:text-white disabled:border-ink disabled:text-ink"
    >
      {title}
    </button>
  );
};

export default CreateAccountButton;
