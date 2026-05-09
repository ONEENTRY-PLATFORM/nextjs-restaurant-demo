'use client';

import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * BookATableButton — клиентская кнопка-триггер ReservationPopup.
 *
 * Кладёт в `action` маркер ресторана (= `pageUrl`), чтобы попап
 * предзаполнил дропдаун выбора ресторана.
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
