'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import ClosePopupButton from '@/components/shared/ClosePopupButton';

type TimePickerSheetProps = {
  value?: string;
  onApply: (time: string) => void;
  onClose?: () => void;
  /** Готовый список слотов, по приоритету выше `range`/`step`. Если массив
   * пустой — показываем «No available slots» вместо генерации по диапазону. */
  slots?: string[];
  /** Диапазон 24ч [fromHour, toHour], включительно. По умолчанию [10, 21]. */
  range?: [number, number];
  /** Шаг в часах между слотами. По умолчанию 1. */
  step?: 1 | 2;
};

/**
 * Форматирует число часа (0–23) как `HH.00` согласно конвенции отображения
 * `service_time` из static-html.
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
  slots: slotsProp,
  range = [10, 21],
  step = 1,
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
    <div className="fixed bottom-0 left-0 z-10 w-full rounded-tl-[20px] rounded-tr-[20px] bg-ink/80 px-5 pt-7.25 backdrop-blur-[10px]">
      <div className="mx-auto max-w-77.5 bg-transparent">
        {onClose ? (
          <div className="mb-3 flex justify-end">
            <ClosePopupButton onClose={onClose} ariaLabel="Close time picker" />
          </div>
        ) : null}
        {slots.length === 0 ? (
          <p className="py-5 text-center text-base text-paper/80">
            No available time slots for the selected date.
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
            Apply
          </button>
        </div>
      </div>
      <div className="h-25 border-none bg-transparent" />
    </div>
  );
};

export default TimePickerSheet;
