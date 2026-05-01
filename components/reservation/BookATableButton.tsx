'use client';

import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

/**
 * Кнопка `BOOK A TABLE` для страницы ресторана. Открывает попап
 * {@link ReservationPopup} через {@link OpenDrawerContext} и кладёт в
 * `action` маркер ресторана (= `pageUrl`), чтобы попап предзаполнил
 * дропдаун выбора ресторана.
 *
 * Server-страница ресторана `app/restaurants/[handle]/page.tsx` не
 * может сама дёргать context (она серверная), поэтому кнопка-триггер
 * вынесена в отдельный клиентский компонент.
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
