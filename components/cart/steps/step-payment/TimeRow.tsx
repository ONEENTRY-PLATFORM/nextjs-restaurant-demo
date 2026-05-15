'use client';

import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import ClockCircleIcon from '@/components/icons/clock-circle';

import type { DeliveryMode } from './constants';

type Props = {
  mode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
  scheduleAt: string;
  onSchedulePickerOpen: () => void;
  placeholder: string;
};

/**
 * TimeRow — delivery time selector: ASAP (45-min interval) or scheduled (date/time picker).
 *
 * @param   {object}                       props                      - Component props.
 * @param   {DeliveryMode}                 props.mode                 - Current delivery mode.
 * @param   {(mode: DeliveryMode) => void} props.onModeChange         - Mode change handler.
 * @param   {string}                       props.scheduleAt           - Pre-formatted `DD.MM.YY HH.MM` value (empty when not yet scheduled).
 * @param   {() => void}                   props.onSchedulePickerOpen - Called when the user clicks the readonly schedule input; parent opens the picker sheet.
 * @param   {string}                       props.placeholder          - Schedule input placeholder pulled from the `delivery_time` form-attribute `additionalFields`.
 * @returns JSX of the time row.
 */
const TimeRow = ({
  mode,
  onModeChange,
  scheduleAt,
  onSchedulePickerOpen,
  placeholder,
}: Props): JSX.Element => {
  const t = useT();

  return (
    <div className="step-payment-row mt-5 flex flex-col gap-5">
      <div className="flex items-center gap-2.5 text-paper">
        <ClockCircleIcon variant="paper" />
        <p className="font-normal text-xl text-paper">{t('time_text', 'Time')}</p>
      </div>
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="time-asap"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'asap'}
          onChange={() => onModeChange('asap')}
        />
        <label
          htmlFor="time-asap"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">40-45 min</span>
        </label>
      </div>
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="time-scheduled"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'scheduled'}
          onChange={() => onModeChange('scheduled')}
        />
        <label
          htmlFor="time-scheduled"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">{t('by_the_time', 'by the time')}</span>
        </label>
        <input
          type="text"
          value={scheduleAt}
          readOnly
          onClick={onSchedulePickerOpen}
          placeholder={placeholder}
          className="cursor-pointer rounded-card border border-white bg-transparent px-1.25 text-brand opacity-80 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default TimeRow;
