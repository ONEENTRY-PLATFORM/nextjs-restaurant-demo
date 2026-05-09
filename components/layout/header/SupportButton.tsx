'use client';

import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import PhoneIcon from '@/components/icons/phone.svg';

/**
 * SupportButton — phone icon in the mobile header.
 *
 * @param   {object}      props          - Button props.
 * @param   {boolean}     props.disabled - Neither phone nor WhatsApp is available.
 * @returns {JSX.Element}                Popup trigger JSX.
 */
const SupportButton = ({ disabled }: { disabled: boolean }): JSX.Element => {
  const { setComponent, setTransition, setOpen } = useContext(OpenDrawerContext);

  if (disabled) {
    return (
      <span className="w-4.5 h-4.5 opacity-60" aria-hidden="true">
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
      className="w-4.5 h-4.5 bg-transparent border-0 p-0 cursor-pointer"
    >
      <PhoneIcon title="call" />
    </button>
  );
};

export default SupportButton;
