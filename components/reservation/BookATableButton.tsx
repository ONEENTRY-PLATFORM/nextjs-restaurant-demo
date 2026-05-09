'use client';

import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * BookATableButton — client-side trigger button for ReservationPopup.
 *
 * Stores the restaurant marker (= `pageUrl`) in `action` so the popup
 * can pre-fill the restaurant picker dropdown.
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
