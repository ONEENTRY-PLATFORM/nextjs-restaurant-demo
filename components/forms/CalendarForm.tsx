'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import TimePickerSheet from '@/components/ui/TimePickerSheet';

type PickerMode = 'date' | 'time' | null;

/**
 * Calendar form — modal popup for picking delivery date + time. Opened
 * from the cart preview rows ({@link DeliveryTableRow}) via
 * `setComponent('CalendarForm')` and rendered through the shared
 * {@link Modal} layer.
 *
 * Persists selection into `cartReducer.deliveryData` and closes the
 * modal — the existing wizard `time` step is reserved for the full
 * checkout flow; this is the inline picker for the cart screen.
 * @param   {object}           props          - Form props.
 * @param   {IAttributeValues} props.dict     - Static-content dictionary.
 * @param   {string}           props.className - Class wrapper.
 * @param   {boolean}          props.isActive - Whether the modal is open.
 * @returns {JSX.Element}                     Form JSX.
 */
const CalendarForm = ({
  dict,
  className,
  isActive,
}: {
  dict: IAttributeValues;
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { setTransition } = useContext(OpenDrawerContext);
  const delivery = useAppSelector(selectDeliveryData);

  const [date, setDate] = useState<string>(() => {
    const ts = delivery?.date as number | undefined;
    const d = ts ? new Date(ts) : new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState<string>(
    (delivery?.time as string | undefined) ?? '',
  );
  const [picker, setPicker] = useState<PickerMode>(null);

  const onSave = () => {
    dispatch(
      setDeliveryData({
        ...delivery,
        date: new Date(date).getTime(),
        time,
      }),
    );
    setTransition('close');
  };

  return (
    <FormAnimations className={className} isLoading={false} isActive={isActive}>
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setPicker('date')}
          className="flex flex-col items-start gap-1 border-b border-b-muted py-2 text-left"
        >
          <span className="cart_label">Date</span>
          <span className="text-lg text-paper">{date || 'Select date'}</span>
        </button>

        <button
          type="button"
          onClick={() => setPicker('time')}
          className="flex flex-col items-start gap-1 border-b border-b-muted py-2 text-left"
        >
          <span className="cart_label">
            {(dict?.time_text?.value as string | undefined) ?? 'Time'}
          </span>
          <span className="text-lg text-paper">{time || 'Select time'}</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!time || !date}
          className="cart_btn disabled:opacity-60"
        >
          {(dict?.apply_text?.value as string | undefined) ?? 'Apply'}
        </button>

        {picker === 'date' ? (
          <DatePickerSheet
            value={date}
            minDate={new Date().toISOString().slice(0, 10)}
            onApply={(iso) => {
              setDate(iso);
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        ) : null}
        {picker === 'time' ? (
          <TimePickerSheet
            value={time}
            onApply={(t) => {
              setTime(t);
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        ) : null}
      </div>
    </FormAnimations>
  );
};

export default CalendarForm;
