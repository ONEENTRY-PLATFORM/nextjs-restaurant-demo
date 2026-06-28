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
      className="hover_btn_brand flex h-14 w-full items-center justify-center gap-6.25 rounded-panel border border-brand bg-transparent text-center text-[17px] font-semibold text-brand active:bg-brand-soft-active active:text-white disabled:border-ink disabled:text-ink"
    >
      {title}
    </button>
  );
};

export default CreateAccountButton;
