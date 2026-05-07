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
  /** Заголовок шага выбора даты (по умолчанию "Date"). */
  dateTitle?: string;
  /** Заголовок шага выбора времени (по умолчанию "Time"). */
  timeTitle?: string;
  applyText?: string | undefined;
  continueText?: string | undefined;
  noTimeText?: string | undefined;
};

/**
 * Двухшаговый bottom-sheet (на мобиле) / модальный попап (на md+) для выбора
 * даты и времени:
 *
 *   Шаг 1 (`date`): календарь — пользователь выбирает день, нажимает `Continue`
 *     и попадает на шаг 2.
 *   Шаг 2 (`time`): сетка временных слотов из `timeInterval`, кнопка `Apply`
 *     закрывает попап через `onApply(date, time)`. В шапке — стрелка назад,
 *     возвращающая к шагу 1 (выбранный день и время сохраняются).
 *
 * См. вёрстку `static-html/service_date.html` (шаг 1) и
 * `static-html/service_time.html` (шаг 2) — оригинал тоже был двухэкранный.
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
  dateTitle = 'Date',
  timeTitle = 'Time',
  applyText = 'Apply',
  continueText = 'Continue',
  noTimeText = 'No available time slots for the selected date.',
}: DateTimePickerSheetProps): JSX.Element => {
  const today = useMemo(() => new Date(), []);
  const initial = date ? new Date(date) : today;
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(date ?? '');
  const [selectedTime, setSelectedTime] = useState<string>(time ?? '');
  const [stepName, setStepName] = useState<'date' | 'time'>('date');

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

  const isDateStep = stepName === 'date';
  const canContinue = !!selectedDate;
  const canApply = !!selectedDate && !!selectedTime;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] w-full flex-col rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10">
        <div className="mb-5 flex items-center justify-between gap-5">
          {isDateStep ? (
            <span className="h-5 w-6.75" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => setStepName('date')}
              aria-label="Back to date selection"
              className="group flex items-center justify-center"
            >
              <ArrowBackIcon className="hover-target text-paper" />
            </button>
          )}
          <h2 className="flex-1 text-center font-bold text-[20px] uppercase text-brand">
            {isDateStep ? dateTitle : timeTitle}
          </h2>
          {onClose ? (
            <ClosePopupButton onClose={onClose} ariaLabel="Close date and time picker" />
          ) : (
            <span className="h-5 w-5" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isDateStep ? (
            <div className="mx-auto w-full max-w-87.5">
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
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous month"
                  className="group"
                >
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
          ) : (
            <div className="mx-auto w-full max-w-87.5">
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
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center">
          {isDateStep ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStepName('time')}
              className="block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
            >
              {continueText}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canApply}
              onClick={() => onApply(selectedDate, selectedTime)}
              className="block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
            >
              {applyText}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default DateTimePickerSheet;
