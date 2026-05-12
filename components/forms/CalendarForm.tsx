'use client';

import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectDeliveryData, setDeliveryData } from '@/app/store/reducers/CartSlice';
import { toLocalIsoDate } from '@/app/utils/formatDate';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

/**
 * CalendarForm — modal popup for picking delivery date + time.
 *
 * @param   {object}  props           - Component props.
 * @param   {string}  props.className - Wrapper class merged onto the animated form root.
 * @param   {boolean} props.isActive  - Whether the modal is open (drives animations).
 * @returns JSX of the calendar form (date/time triggers + bottom-sheet picker).
 */
const CalendarForm = ({
  className,
  isActive,
}: {
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { setTransition } = useContext(OpenDrawerContext);
  const delivery = useAppSelector(selectDeliveryData);

  const [date, setDate] = useState<string>(() => {
    const ts = delivery?.date as number | undefined;
    return toLocalIsoDate(ts ? new Date(ts) : new Date());
  });
  const [time, setTime] = useState<string>((delivery?.time as string | undefined) ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);

  const onSave = () => {
    dispatch(
      setDeliveryData({
        ...delivery,
        date: new Date(date).getTime(),
        time,
      })
    );
    setTransition('close');
  };

  return (
    <FormAnimations className={className} isLoading={false} isActive={isActive}>
      <div className="flex flex-col gap-6">
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
          onClick={onSave}
          disabled={!time || !date}
          className="cart_btn disabled:opacity-60"
        >
          {t('apply_text', 'Apply')}
        </button>

        {pickerOpen ? (
          <DateTimePickerSheet
            date={date}
            time={time}
            minDate={toLocalIsoDate()}
            onApply={(d, tm) => {
              setDate(d);
              setTime(tm);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
            dateTitle={t('date_text', 'Date')}
            timeTitle={t('time_text', 'Time')}
            applyText={t('apply_text', '') || undefined}
            continueText={t('continue_text', '') || undefined}
            noTimeText={t('no_time_text', '') || undefined}
          />
        ) : null}
      </div>
    </FormAnimations>
  );
};

export default CalendarForm;
