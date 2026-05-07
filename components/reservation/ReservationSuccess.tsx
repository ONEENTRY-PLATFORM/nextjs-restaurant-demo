'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

type ReservationSuccessProps = {
  orderId: number;
  /**
   * Сводка по бронированию: дата + время + кол-во гостей.
   * Формат по Figma 120:2338 — `DD.MM.YY HH.MM N person`. Подставляется
   * вызывающим кодом, потому что значения сидят в form-state и оттуда
   * формируются (см. `buildBookingSummary` в `ReservationForm`).
   */
  summary: string;
};

/**
 * Экран подтверждения брони — Figma `120:2338` в `Rest_desktop`. Большой
 * текст оранжевый Lato Light 32/40 с номером заказа, разделитель paper,
 * мелкая сводка `DD.MM.YY HH.MM N person` снизу Lato Regular 20/paper.
 *
 * Появляется в попапе сразу после успешного `Orders.createOrder`. Для
 * online-методов (Stripe) пользователя редиректит на `paymentUrl` ещё
 * до этого экрана — туда возврат происходит уже на success-URL,
 * сконфигурированный в OneEntry (см. `MISMATCH-LOG.md` § C.6).
 * @param   {ReservationSuccessProps} props - Пропсы экрана.
 * @returns {JSX.Element}                  JSX экрана подтверждения.
 */
const ReservationSuccess = ({ orderId, summary }: ReservationSuccessProps): JSX.Element => {
  const t = useT();
  const confirmedText = t(
    'booking_confirmed_message',
    'Your reservation has been confirmed.\nSee you soon!'
  );

  return (
    <div className="flex w-full flex-col items-center gap-5 px-5 md:px-19">
      <div className="flex flex-col items-center gap-0">
        <p className="text-center font-light text-[32px] leading-10 text-brand">№ {orderId}</p>
        <p className="mt-2.5 text-center font-light text-[32px] leading-10 text-brand whitespace-pre-line">
          {confirmedText}
        </p>
      </div>

      {summary ? (
        <>
          <span className="block h-px w-45.75 bg-paper" aria-hidden="true" />
          <p className="text-center font-normal text-[20px] tracking-[0.02em] text-paper">
            {summary}
          </p>
        </>
      ) : null}
    </div>
  );
};

export default ReservationSuccess;
