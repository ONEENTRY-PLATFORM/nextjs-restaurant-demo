'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

type ReservationSuccessProps = {
  orderId: number;
  /** Summary `DD.MM.YY HH.MM N person` per Figma 120:2338. Built by the caller. */
  summary: string;
};

/**
 * ReservationSuccess - booking confirmation screen shown after `Orders.createOrder`.
 *
 * @param   {ReservationSuccessProps} props - Screen props.
 * @returns {JSX.Element}                   Confirmation screen JSX.
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
        <p className="text-center font-light text-[32px] leading-10 text-brand">â„– {orderId}</p>
        <p className="mt-2.5 text-center font-light text-[32px] leading-10 text-brand whitespace-pre-line">
          {confirmedText}
        </p>
      </div>

      {summary ? (
        <>
          <span className="block h-px w-45.75 bg-paper" aria-hidden="true" />
          <p className="text-center font-normal text-xl tracking-fine text-paper">{summary}</p>
        </>
      ) : null}
    </div>
  );
};

export default ReservationSuccess;
