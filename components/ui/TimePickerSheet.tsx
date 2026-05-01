'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import ArrowBackIcon from '@/components/icons/arrow-back';
import ClosePopupButton from '@/components/shared/ClosePopupButton';

type TimePickerSheetProps = {
  value?: string;
  onApply: (time: string) => void;
  onClose?: () => void;
  onBack?: () => void;
  slots?: string[];
  range?: [number, number];
  step?: 1 | 2;
  applyText?: string | undefined;
  noTimeText?: string | undefined;
};

/**
 * Форматирует число часа (0–23) как `HH.00`
 * @param   {number} h - Час 0–23.
 * @returns {string}   Метка вида `"10.00"`.
 */
const formatHour = (h: number): string => `${String(h).padStart(2, '0')}.00`;

/**
 * Фиксированный bottom-sheet time picker — повторяет `service_time.html`.
 * Использует утилитарный класс `.service_time` из `app/styles/main.css`.
 *
 * Если переданы `slots` — берём именно их (используется для показа
 * доступных временных слотов из расписания ресторана OneEntry, см.
 * атрибут `schedule.value[*].values[*].times`). Иначе генерим по
 * `range`/`step` как раньше — fallback для случаев, когда расписания
 * нет.
 * @param   {TimePickerSheetProps} props - Пропсы компонента.
 * @returns {JSX.Element}                JSX sheet-а.
 */
const TimePickerSheet = ({
  value,
  onApply,
  onClose,
  onBack,
  slots: slotsProp,
  range = [10, 21],
  step = 1,
  applyText = 'Apply',
  noTimeText = 'No available time slots for the selected date.',
}: TimePickerSheetProps): JSX.Element => {
  const [selected, setSelected] = useState<string>(value ?? '');

  let slots: string[];
  if (slotsProp) {
    slots = slotsProp;
  } else {
    slots = [];
    for (let h = range[0]; h <= range[1]; h += step) {
      slots.push(formatHour(h));
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex min-h-162.5 max-h-[90vh] w-full items-center justify-center rounded-t-[20px] bg-ink/80 px-5 pt-7.25 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="group absolute left-5 top-5 flex items-center justify-center md:left-10 md:top-10"
        >
          <ArrowBackIcon className="hover-target text-paper" />
        </button>
      ) : null}
      {onClose ? (
        <div className="absolute right-5 top-5 md:right-10 md:top-10">
          <ClosePopupButton onClose={onClose} ariaLabel="Close time picker" />
        </div>
      ) : null}
      <div className="w-full max-w-77.5 bg-transparent">
        {slots.length === 0 ? (
          <p className="py-5 text-center text-base text-paper/80">
            {noTimeText}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {slots.map((slot) => {
              const active = slot === selected;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={
                    'service_time ' +
                    (active ? 'border-brand text-brand font-extrabold ' : '')
                  }
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            disabled={!selected}
            onClick={() => onApply(selected)}
            className="mx-auto block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
          >
            {applyText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerSheet;
