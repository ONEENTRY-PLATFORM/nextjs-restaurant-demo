'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useMemo, useRef, useState } from 'react';

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

/** Builds a rectangular 6×7 day grid for the month, padded with tails of neighboring months. */
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
  date?: string;
  time?: string;
  onApply: (date: string, time: string) => void;
  onClose?: () => void;
  minDate?: string;
  getSlots?: (dateIso: string) => string[];
  range?: [number, number];
  step?: 1 | 2;
  dateTitle?: string;
  timeTitle?: string;
  applyText?: string | undefined;
  continueText?: string | undefined;
  noTimeText?: string | undefined;
};

/**
 * DateTimePickerSheet — two-step bottom-sheet/modal for selecting date and time.
 * Step 1 — calendar, Step 2 — time-slot grid; `Apply` invokes `onApply(date, time)`.
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

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const modalBg = wrapperRef.current?.querySelector('#modalBg') ?? null;
    const modalBody = wrapperRef.current?.querySelector('#modalBody') ?? null;
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    gsap.set(modalBg, { autoAlpha: 0 });
    if (isMobile) {
      gsap.set(modalBody, { yPercent: 100 });
    } else {
      gsap.set(modalBody, { autoAlpha: 0, scale: 0.85 });
    }

    const tl = gsap.timeline({ paused: true });
    tl.to(modalBg, {
      autoAlpha: 1,
      backdropFilter: 'blur(10px)',
      duration: 0.5,
    }).to(
      modalBody,
      isMobile
        ? { autoAlpha: 1, yPercent: 0, duration: 0.5 }
        : { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)' },
      '-=0.25'
    );

    tlRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
    };
  }, []);

  const animateAndRun = (cb: () => void): void => {
    const tl = tlRef.current;
    if (!tl) {
      cb();
      return;
    }
    tl.eventCallback('onReverseComplete', cb);
    tl.reverse(2);
  };

  const handleClose = (): void => {
    if (!onClose) return;
    animateAndRun(onClose);
  };
  const handleApply = (): void => {
    animateAndRun(() => onApply(selectedDate, selectedTime));
  };

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    if (getSlots) return getSlots(selectedDate);
    const out: string[] = [];
    for (let h = range[0]; h <= range[1]; h += step) out.push(formatHour(h));
    return out;
  }, [selectedDate, getSlots, range, step]);

  // Intentionally do NOT reset the selected time when the date changes — the user expects the selection to persist "until I change it".

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
    <div ref={wrapperRef} className="z-500 fixed inset-0 flex h-screen w-full">
      <div
        id="modalBg"
        className="fixed inset-0 size-full min-w-full min-h-full bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
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
            <ClosePopupButton onClose={handleClose} ariaLabel="Close date and time picker" />
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
              onClick={handleApply}
              className="block rounded-[5px] border border-brand px-3.75 py-1.25 font-bold text-[20px] text-brand hover_btn_white disabled:opacity-60"
            >
              {applyText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimePickerSheet;
