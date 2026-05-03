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
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import TimePickerSheet from '@/components/ui/TimePickerSheet';
import { dictText } from '@/components/utils';

type PickerMode = 'date' | 'time' | null;

/**
 * Шаг checkout — выбор date + time. Использует фуллскрин slide-up sheets
 * ({@link DatePickerSheet}, {@link TimePickerSheet}), которые повторяют
 * `service_date.html` / `service_time.html`. Тап по полю открывает
 * соответствующий sheet; `Apply` сохраняет значение и закрывает.
 * @param   {object}           props      - Пропсы шага.
 * @param   {IAttributeValues} props.dict - Словарь статического контента (для Time/Date лейблов).
 * @returns {JSX.Element}                 JSX шага.
 */
const StepTime = ({ dict }: { dict: IAttributeValues }): JSX.Element => {
  const dispatch = useAppDispatch();
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
          {dictText(dict, 'time_text', 'Time')}
        </span>
        <span className="text-lg text-paper">{time || 'Select time'}</span>
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!time || !date}
        className="cart_btn disabled:opacity-60"
      >
        Continue
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
  );
};

export default StepTime;
