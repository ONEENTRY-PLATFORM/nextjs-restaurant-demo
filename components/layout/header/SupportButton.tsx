'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import PhoneIcon from '@/components/icons/phone.svg';

/**
 * SupportButton — phone icon in the mobile header that opens the `SupportPopup`.
 *
 * @param   {object}      props          - Component props.
 * @param   {boolean}     props.disabled - When `true`, neither phone nor WhatsApp is available — render a non-interactive icon.
 * @returns JSX of the popup trigger button (or a disabled span fallback).
 */
const SupportButton = ({ disabled }: { disabled: boolean }): JSX.Element => {
  const { setComponent, setTransition, setOpen } = useContext(OpenDrawerContext);

  if (disabled) {
    return (
      <span className="size-4.5 opacity-60" aria-hidden="true">
        <PhoneIcon />
      </span>
    );
  }

  const handleClick = (): void => {
    setComponent('SupportPopup');
    setTransition('');
    setOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open support"
      className="size-4.5 cursor-pointer border-0 bg-transparent p-0"
    >
      <PhoneIcon title="call" />
    </button>
  );
};

export default SupportButton;
