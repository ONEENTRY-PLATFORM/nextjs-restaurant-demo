'use client';

import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * BookATableButton — client-side trigger button for `ReservationPopup`.
 *
 * Stores the restaurant marker (= `pageUrl`) in `action` so the popup can pre-fill the restaurant picker.
 *
 * @param   {object}    props                  - Component props.
 * @param   {string}    props.restaurantHandle - OneEntry restaurant `pageUrl` (used as the picker pre-fill).
 * @param   {string}    [props.className]      - Class merged onto the button element.
 * @param   {ReactNode} props.children         - Button label content.
 * @returns {JSX.Element}                        JSX of the trigger button.
 */
const BookATableButton = ({
  restaurantHandle,
  className,
  children,
}: {
  restaurantHandle: string;
  className?: string;
  children: ReactNode;
}): JSX.Element => {
  const { setComponent, setAction, setOpen } = useContext(OpenDrawerContext);

  const onClick = () => {
    setComponent('ReservationPopup');
    setAction(restaurantHandle);
    setOpen(true);
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default BookATableButton;
