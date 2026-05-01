'use client';

import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import ArrowBackIcon from '@/components/icons/arrow-back';
import ChevronMiniLeftIcon from '@/components/icons/chevron-mini-left.svg';
import ChevronMiniRightIcon from '@/components/icons/chevron-mini-right.svg';
import ClosePopupButton from '@/components/shared/ClosePopupButton';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type DayCell = {
  day: number;
  monthOffset: -1 | 0 | 1;
  iso: string;
};

/**
 * Строит сетку 6×7 календарных дней для данного года/месяца, дополняя
 * хвостовыми днями предыдущего месяца и начальными днями следующего, чтобы
 * сетка всегда была прямоугольной.
 * @param   {number}      year  - Целевой год.
 * @param   {number}      month - Целевой месяц (0-based).
 * @returns {DayCell[]}         42 ячейки (6 строк × 7 колонок).
 */
const buildMonthGrid = (year: number, month: number): DayCell[] => {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7; // 0 = Пн
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = firstDow - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    const d = new Date(year, month - 1, day);
    cells.push({
      day,
      monthOffset: -1,
      iso: d.toISOString().slice(0, 10),
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    cells.push({
      day,
      monthOffset: 0,
      iso: d.toISOString().slice(0, 10),
    });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    cells.push({
      day: nextDay,
      monthOffset: 1,
      iso: d.toISOString().slice(0, 10),
    });
    nextDay += 1;
  }
  return cells;
};

type DatePickerSheetProps = {
  value?: string;
  onApply: (iso: string) => void;
  onClose?: () => void;
  /** Back-кнопка слева. По смыслу обычно === `onClose` для пикера даты,
   * но оставляем как отдельный prop, чтобы вызывающий мог передать,
   * например, переход к предыдущему шагу. Если не задан — back-кнопка
   * не рендерится. */
  onBack?: () => void;
  minDate?: string;
  /** Лейбл главной кнопки. Прокидывается из словаря OneEntry
   * (`static_content.apply_text`) — fallback на "Apply". */
  applyText?: string | undefined;
};

/**
 * Фиксированный bottom-sheet date picker (мобильный) — повторяет
 * `service_date.html`. Использует утилитарные классы `.calend_mon` и
 * `.calend_days` из `app/styles/main.css`. Принимает любое ISO-значение
 * `yyyy-MM-dd` и эмитит ту же форму через {@link onApply}.
 * @param   {DatePickerSheetProps} props - Пропсы компонента.
 * @returns {JSX.Element}                JSX sheet-а.
 */
const DatePickerSheet = ({
  value,
  onApply,
  onClose,
  onBack,
  minDate,
  applyText = 'Apply',
}: DatePickerSheetProps): JSX.Element => {
  const today = useMemo(() => new Date(), []);
  const initial = value ? new Date(value) : today;
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState(
    value ?? today.toISOString().slice(0, 10),
  );

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    // Размеры подгоняем под ReservationPopup: на мобиле — bottom-sheet
    // во всю ширину (`min-h-162.5`), на md+ — центрированная карточка
    // `max-w-150` так же, как у попапа Book a Table. Контент пикера
    // (сетка дней + Apply) центрирован; X-кнопка абсолютно в правом
    // верхнем углу, чтобы не сдвигать контент сверху.
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
          <ClosePopupButton onClose={onClose} ariaLabel="Close date picker" />
        </div>
      ) : null}
      <div className="w-full max-w-87.5 bg-transparent">
        <div className="grid grid-cols-7">
          {WEEK.map((w) => (
            <div key={w} className="calend_mon">
              {w}
            </div>
          ))}
          {grid.map((cell) => {
            const active = cell.iso === selected && cell.monthOffset === 0;
            const disabled =
              (minDate && cell.iso < minDate) || cell.monthOffset !== 0;
            return (
              <button
                key={cell.iso + cell.monthOffset}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(cell.iso)}
                className={
                  'calend_days ' +
                  (active ? 'bg-brand text-white font-bold ' : '') +
                  (disabled ? 'opacity-40 pointer-events-none ' : '')
                }
              >
                {String(cell.day).padStart(2, '0')}
              </button>
            );
          })}
        </div>
        <div className="mb-5 mt-4 flex items-center justify-around">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="group"
          >
            <ChevronMiniLeftIcon />
          </button>
          <div className="flex gap-3.75">
            <h2 className="font-semibold text-[20px] text-brand">
              {MONTH_NAMES[month]}
            </h2>
            <h3 className="font-light text-[20px] text-brand">{year}</h3>
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="group"
          >
            <ChevronMiniRightIcon />
          </button>
        </div>
        <div className="mb-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => onApply(selected)}
            className="block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_transp"
          >
            {applyText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerSheet;
