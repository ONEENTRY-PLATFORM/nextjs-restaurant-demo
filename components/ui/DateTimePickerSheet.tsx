'use client';

import type { JSX } from 'react';
import { useMemo, useState } from 'react';

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
 */
const buildMonthGrid = (year: number, month: number): DayCell[] => {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7;
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

const formatHour = (h: number): string => `${String(h).padStart(2, '0')}.00`;

type DateTimePickerSheetProps = {
  /** Стартовая дата `yyyy-MM-dd`. Если не задана — день не выбран и слоты не показаны. */
  date?: string;
  /** Стартовое время вида `HH.MM`. */
  time?: string;
  /** Выбор подтверждён — единый callback с обоими значениями. */
  onApply: (date: string, time: string) => void;
  onClose?: () => void;
  /** Минимальная допустимая дата `yyyy-MM-dd` (включительно). */
  minDate?: string;
  /**
   * Поставщик слотов для выбранной даты. Используется в форме бронирования —
   * слоты приходят из расписания ресторана OneEntry (атрибут `schedule`,
   * тип `timeInterval`). Если не задан — слоты генерятся по `range`/`step`.
   * Если задан и вернул `[]` — показывается `noTimeText`.
   */
  getSlots?: (dateIso: string) => string[];
  range?: [number, number];
  step?: 1 | 2;
  /** Заголовок попапа целиком. */
  title?: string;
  /** Заголовок секции даты (по умолчанию "Date"). */
  dateTitle?: string;
  /** Заголовок секции времени (по умолчанию "Time"). */
  timeTitle?: string;
  applyText?: string | undefined;
  noTimeText?: string | undefined;
};

/**
 * Объединённый bottom-sheet (на мобиле) / модальный попап (на md+) для выбора
 * даты и времени в одном UI:
 *
 *   1) Заголовок попапа сверху + подзаголовки секций ("Date", "Time").
 *   2) Сначала календарь — пользователь выбирает день.
 *   3) После выбора дня снизу появляется секция со слотами `timeInterval`.
 *   4) `Apply` активируется, когда выбраны и дата, и время.
 *
 * Заменяет пару `DatePickerSheet` + `TimePickerSheet`, где сначала открывался
 * один попап, потом второй. См. вёрстку `service_date.html` / `service_time.html`
 * — теперь это слитый экран.
 */
const DateTimePickerSheet = ({
  date,
  time,
  onApply,
  onClose,
  minDate,
  getSlots,
  range = [10, 21],
  step = 1,
  title = 'Select date and time',
  dateTitle = 'Date',
  timeTitle = 'Time',
  applyText = 'Apply',
  noTimeText = 'No available time slots for the selected date.',
}: DateTimePickerSheetProps): JSX.Element => {
  const today = useMemo(() => new Date(), []);
  const initial = date ? new Date(date) : today;
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(date ?? '');
  const [selectedTime, setSelectedTime] = useState<string>(time ?? '');

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    if (getSlots) return getSlots(selectedDate);
    const out: string[] = [];
    for (let h = range[0]; h <= range[1]; h += step) out.push(formatHour(h));
    return out;
  }, [selectedDate, getSlots, range, step]);

  // Намеренно НЕ сбрасываем выбранное время при смене даты или после ремаунта:
  // пользователь хочет, чтобы выбор сохранялся «пока я его не поменяю».
  // Если после смены даты старое время не входит в новый список слотов —
  // оно просто не подсветится в гриде; это допустимо, пользователь увидит,
  // что слот не активен, и выберет новый.

  const goPrev = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const canApply = !!selectedDate && !!selectedTime;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex max-h-[90vh] w-full flex-col rounded-t-[20px] bg-ink/80 px-5 pt-7.25 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10">
      {onClose ? (
        <div className="absolute right-5 top-5 md:right-10 md:top-10">
          <ClosePopupButton onClose={onClose} ariaLabel="Close date and time picker" />
        </div>
      ) : null}

      <h2 className="mb-5 text-center font-bold text-[20px] uppercase text-brand">{title}</h2>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-87.5">
          <h3 className="mb-2.5 font-semibold text-[16px] uppercase text-paper">{dateTitle}</h3>
          <div className="grid grid-cols-7">
            {WEEK.map(w => (
              <div key={w} className="calend_mon">
                {w}
              </div>
            ))}
            {grid.map(cell => {
              const active = cell.iso === selectedDate && cell.monthOffset === 0;
              const disabled = (minDate && cell.iso < minDate) || cell.monthOffset !== 0;
              return (
                <button
                  key={cell.iso + cell.monthOffset}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedDate(cell.iso)}
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
            <button type="button" onClick={goPrev} aria-label="Previous month" className="group">
              <ChevronMiniLeftIcon />
            </button>
            <div className="flex gap-3.75">
              <h2 className="font-semibold text-[20px] text-brand">{MONTH_NAMES[month]}</h2>
              <h3 className="font-light text-[20px] text-brand">{year}</h3>
            </div>
            <button type="button" onClick={goNext} aria-label="Next month" className="group">
              <ChevronMiniRightIcon />
            </button>
          </div>
        </div>

        {selectedDate ? (
          <div className="mx-auto w-full max-w-87.5">
            <h3 className="mb-2.5 font-semibold text-[16px] uppercase text-paper">{timeTitle}</h3>
            {slots.length === 0 ? (
              <p className="py-5 text-center text-base text-paper/80">{noTimeText}</p>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {slots.map(slot => {
                  const active = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={
                        'service_time ' + (active ? 'border-brand text-brand font-extrabold ' : '')
                      }
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <button
          type="button"
          disabled={!canApply}
          onClick={() => onApply(selectedDate, selectedTime)}
          className="block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
        >
          {applyText}
        </button>
      </div>
    </div>
  );
};

export default DateTimePickerSheet;
