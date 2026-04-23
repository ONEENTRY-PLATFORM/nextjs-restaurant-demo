'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';

type DeliveryMode = 'asap' | 'scheduled';

/**
 * Checkout step — delivery address + delivery time mode (per `cart_PAYMENT.html`
 * Address + Time blocks).
 *
 * Address: text input with edit pencil icon on the right.
 * Time: two radio options — "40-45 min" (ASAP) or "by the time" (scheduled,
 * text input like `18.06.24 10.00`).
 * @returns {JSX.Element} Step JSX.
 */
const StepAddress = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const delivery = useAppSelector(selectDeliveryData);
  const [address, setAddress] = useState(
    (delivery?.address as string | undefined) ?? '',
  );
  const [mode, setMode] = useState<DeliveryMode>('asap');
  const [scheduleAt, setScheduleAt] = useState<string>('');

  const onNext = () => {
    dispatch(
      setDeliveryData({
        ...delivery,
        address,
        time:
          mode === 'asap'
            ? '40-45 min'
            : scheduleAt || (delivery?.time as string | undefined) || '',
      }),
    );
    dispatch(setStep('payment'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Address header */}
      <div className="flex items-center gap-[10px] text-paper">
        <svg
          width="17"
          height="19"
          viewBox="0 0 17 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M14.51 13.9883L9.88742 18.4457C9.70526 18.6215 9.48897 18.7608 9.25091 18.8559C9.01284 18.951 8.75767 19 8.49998 19C8.24228 19 7.98711 18.951 7.74905 18.8559C7.51099 18.7608 7.2947 18.6215 7.11254 18.4457L2.48991 13.9883C1.70057 13.2274 1.07442 12.3242 0.647199 11.3301C0.219979 10.3359 0 9.27045 0 8.19441C0 7.11836 0.219738 6.05284 0.646845 5.05868C1.07395 4.06452 1.70001 3.16119 2.48926 2.40027C3.27851 1.63935 4.21551 1.03574 5.24675 0.623899C6.27799 0.21206 7.38328 0 8.49952 0C9.61575 0 10.7211 0.211827 11.7524 0.623558C12.7836 1.03529 13.7207 1.6388 14.51 2.39964C15.2994 3.16053 15.9256 4.06386 16.3529 5.05805C16.7801 6.05225 17 7.11784 17 8.19396C17 9.27009 16.7801 10.3357 16.3529 11.3299C15.9256 12.3241 15.2994 13.2274 14.51 13.9883ZM8.49998 10.7158C7.80535 10.7234 7.15719 10.4174 6.61278 9.99825C6.36364 9.76351 6.16567 9.48315 6.03047 9.17364C5.89528 8.86413 5.82559 8.5317 5.82551 8.19587C5.82542 7.86004 5.89493 7.52757 6.02997 7.21799C6.165 6.90842 6.36283 6.62797 6.61185 6.39311C6.86086 6.15825 7.15604 5.97372 7.48005 5.85034C7.80407 5.72697 8.15038 5.66724 8.49867 5.67466C9.18201 5.68923 9.83228 5.9611 10.3103 6.43208C10.7883 6.90305 11.056 7.53571 11.0562 8.19461C11.0564 8.8535 10.789 9.48629 10.3112 9.95749C9.83344 10.4287 9.18331 10.7009 8.49998 10.7158Z"
            fill="#DFE9F9"
          />
        </svg>
        <p className="font-normal text-[20px] text-paper">Address</p>
      </div>

      {/* Address input with pencil */}
      <div className="relative flex items-center gap-[10px] text-paper">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
          placeholder="OneEntry str."
          className="w-full rounded-[5px] border border-paper bg-transparent p-[5px] text-[16px] text-paper placeholder:text-[#a8a9b5] focus:outline-none"
        />
        <svg
          className="absolute right-[7px] top-[7px] pointer-events-none"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M20 5.73928C20.0008 5.60768 19.9756 5.47722 19.9258 5.35538C19.876 5.23354 19.8027 5.12272 19.71 5.02928L15.47 0.789284C15.3766 0.696603 15.2658 0.623278 15.1439 0.573513C15.0221 0.523748 14.8916 0.498523 14.76 0.499284C14.6284 0.498523 14.4979 0.523748 14.3761 0.573513C14.2543 0.623278 14.1435 0.696603 14.05 0.789284L11.22 3.61928L0.290017 14.5493C0.197335 14.6427 0.12401 14.7535 0.0742455 14.8754C0.0244809 14.9972 -0.000744179 15.1277 1.67143e-05 15.2593V19.4993C1.67143e-05 19.7645 0.105374 20.0189 0.29291 20.2064C0.480446 20.3939 0.7348 20.4993 1.00002 20.4993H5.24002C5.37994 20.5069 5.51991 20.485 5.65084 20.4351C5.78176 20.3851 5.90073 20.3082 6.00002 20.2093L16.87 9.27928L19.71 6.49928C19.8013 6.40237 19.8757 6.29082 19.93 6.16928C19.9397 6.08957 19.9397 6.00899 19.93 5.92928C19.9347 5.88273 19.9347 5.83583 19.93 5.78928L20 5.73928ZM4.83002 18.4993H2.00002V15.6693L11.93 5.73928L14.76 8.56928L4.83002 18.4993ZM16.17 7.15928L13.34 4.32928L14.76 2.91928L17.58 5.73928L16.17 7.15928Z"
            fill="#EC722B"
          />
        </svg>
      </div>

      {/* Time header */}
      <div className="mt-[20px] flex items-center gap-[10px] text-paper">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 0.5C15.2469 0.5 19.5 4.75314 19.5 10C19.5 15.2469 15.2469 19.5 10 19.5C4.75314 19.5 0.5 15.2469 0.5 10C0.5 4.75314 4.75314 0.5 10 0.5ZM10 1.5C7.74566 1.5 5.58365 2.39553 3.98959 3.98959C2.39553 5.58365 1.5 7.74566 1.5 10C1.5 12.2543 2.39553 14.4163 3.98959 16.0104C5.58365 17.6045 7.74566 18.5 10 18.5C12.2543 18.5 14.4163 17.6045 16.0104 16.0104C17.6045 14.4163 18.5 12.2543 18.5 10C18.5 7.74566 17.6045 5.58365 16.0104 3.98959C14.4163 2.39553 12.2543 1.5 10 1.5Z"
            fill="#DFE9F9"
            stroke="#DFE9F9"
          />
        </svg>
        <p className="font-normal text-[20px] text-paper">Time</p>
      </div>

      {/* ASAP radio */}
      <div className="flex items-center gap-[10px] text-paper">
        <input
          type="radio"
          id="time-asap"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'asap'}
          onChange={() => setMode('asap')}
        />
        <label
          htmlFor="time-asap"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">40-45 min</span>
        </label>
      </div>

      {/* Scheduled radio + input */}
      <div className="flex items-center gap-[10px] text-paper">
        <input
          type="radio"
          id="time-scheduled"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'scheduled'}
          onChange={() => setMode('scheduled')}
        />
        <label
          htmlFor="time-scheduled"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">by the time</span>
        </label>
        <input
          type="text"
          value={scheduleAt}
          onChange={(e) => {
            setScheduleAt(e.currentTarget.value);
            setMode('scheduled');
          }}
          placeholder="18.06.24  10.00"
          className="rounded-[5px] border border-white bg-transparent px-[5px] text-brand opacity-80 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!address.trim()}
        className="cart_btn disabled:opacity-60"
      >
        Continue
      </button>
    </div>
  );
};

export default StepAddress;
