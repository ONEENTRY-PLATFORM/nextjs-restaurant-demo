'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import {
  selectDeliveryData,
  setDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

/**
 * Шаг checkout — выбор date + time. Открывает объединённый попап
 * {@link DateTimePickerSheet}: внутри сначала календарь, после выбора дня
 * появляются временные слоты. Один `Apply` сохраняет оба значения и
 * закрывает попап.
 * @returns {JSX.Element} JSX шага.
 */
const StepTime = (): JSX.Element => {
  const t = useT();
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
  const [pickerOpen, setPickerOpen] = useState(false);

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
        onClick={() => setPickerOpen(true)}
        className="flex flex-col items-start gap-1 border-b border-b-muted py-2 text-left"
      >
        <span className="cart_label">{t('date_text', 'Date')}</span>
        <span className="text-lg text-paper">{date || 'Select date'}</span>
      </button>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex flex-col items-start gap-1 border-b border-b-muted py-2 text-left"
      >
        <span className="cart_label">{t('time_text', 'Time')}</span>
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

      {pickerOpen ? (
        <DateTimePickerSheet
          date={date}
          time={time}
          minDate={new Date().toISOString().slice(0, 10)}
          onApply={(d, tm) => {
            setDate(d);
            setTime(tm);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
          title={t('select_datetime_text', 'Select date and time')}
          dateTitle={t('date_text', 'Date')}
          timeTitle={t('time_text', 'Time')}
          applyText={t('apply_text', '') || undefined}
          noTimeText={t('no_time_text', '') || undefined}
        />
      ) : null}
    </div>
  );
};

export default StepTime;
