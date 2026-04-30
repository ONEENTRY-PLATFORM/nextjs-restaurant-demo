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
 * Calendar form — модальный попап для выбора delivery date + time. Открывается
 * из строк превью корзины ({@link DeliveryTableRow}) через
 * `setComponent('CalendarForm')` и рендерится через общий
 * слой {@link Modal}.
 *
 * Сохраняет выбор в `cartReducer.deliveryData` и закрывает
 * модалку — существующий шаг wizard `time` зарезервирован под полный
 * флоу checkout; это инлайн-пикер для экрана корзины.
 * @param   {object}           props          - Пропсы формы.
 * @param   {IAttributeValues} props.dict     - Словарь статического контента.
 * @param   {string}           props.className - Класс-обёртка.
 * @param   {boolean}          props.isActive - Открыта ли модалка.
 * @returns {JSX.Element}                     JSX формы.
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
