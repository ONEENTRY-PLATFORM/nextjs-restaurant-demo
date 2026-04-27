'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import ClockCircleIcon from '@/components/icons/clock-circle';
import PencilIcon from '@/components/icons/pencil';
import PinIcon from '@/components/icons/pin.svg';

type DeliveryMode = 'asap' | 'scheduled';

/**
 * Checkout step — delivery address + delivery time mode (per `cart_PAYMENT.html`
 * Address + Time blocks).
 *
 * Address: text input with edit pencil icon on the right.
 * Time: two radio options — "40-45 min" (ASAP) or "by the time" (scheduled,
 * text input like `18.06.24 10.00`).
 * @param   {object}           props      - Step props.
 * @param   {IAttributeValues} props.dict - Static-content dictionary.
 * @returns {JSX.Element}                 Step JSX.
 */
const StepAddress = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
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
    dispatch(setStep('order'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Address header */}
      <div className="flex items-center gap-2.5 text-paper">
        <PinIcon />
        <p className="font-normal text-[20px] text-paper">
          {(dict?.address_text?.value as string | undefined) ?? 'Address'}
        </p>
      </div>

      {/* Address input with pencil */}
      <div className="relative flex items-center gap-2.5 text-paper">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
          placeholder="OneEntry str."
          className="w-full rounded-[5px] border border-paper bg-transparent p-1.25 text-[16px] text-paper placeholder:text-[#a8a9b5] focus:outline-none"
        />
        <PencilIcon className="absolute right-1.75 top-1.75 pointer-events-none" />
      </div>

      {/* Time header */}
      <div className="mt-5 flex items-center gap-2.5 text-paper">
        <ClockCircleIcon variant="paper" />
        <p className="font-normal text-[20px] text-paper">
          {(dict?.time_text?.value as string | undefined) ?? 'Time'}
        </p>
      </div>

      {/* ASAP radio */}
      <div className="flex items-center gap-2.5 text-paper">
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
      <div className="flex items-center gap-2.5 text-paper">
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
          <span className="ml-2 text-paper">
            {(dict?.by_the_time?.value as string | undefined) ?? 'by the time'}
          </span>
        </label>
        <input
          type="text"
          value={scheduleAt}
          onChange={(e) => {
            setScheduleAt(e.currentTarget.value);
            setMode('scheduled');
          }}
          placeholder="18.06.24  10.00"
          className="rounded-[5px] border border-white bg-transparent px-1.25 text-brand opacity-80 focus:outline-none"
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
