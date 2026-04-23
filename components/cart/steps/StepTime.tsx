'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';

const HOURS = Array.from({ length: 14 }, (_, i) => 10 + i); // 10:00 .. 23:00

/**
 * Checkout step — delivery date + time picker (per `cart_time.html`).
 * Writes to `cartReducer.deliveryData` and advances step to `signin`.
 * @returns {JSX.Element} Step JSX.
 */
const StepTime = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const delivery = useAppSelector(selectDeliveryData);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState<string>(
    (delivery?.time as string | undefined) ?? '',
  );

  const onNext = () => {
    dispatch(
      setDeliveryData({
        ...delivery,
        date: new Date(date).getTime(),
        time,
      }),
    );
    dispatch(setStep('signin'));
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center font-bold text-[20px] uppercase text-brand">
        Select time
      </h2>

      <label className="flex flex-col gap-1">
        <span className="cart_label">Date</span>
        <input
          type="date"
          className="cart_input"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="cart_label">Time</span>
        <div className="flex flex-wrap gap-2">
          {HOURS.map((h) => {
            const label = `${String(h).padStart(2, '0')}:00`;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setTime(label)}
                className={
                  'service_time ' +
                  (time === label
                    ? 'border-brand text-brand font-extrabold'
                    : '')
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!time}
        className="cart_btn disabled:opacity-60"
      >
        Continue
      </button>
    </div>
  );
};

export default StepTime;
