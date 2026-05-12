'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { toLocalIsoDate } from '@/app/utils/formatDate';
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
 * buildMonthGrid — builds a rectangular 6×7 day grid for the month, padded with tails of neighboring months.
 *
 * Uses local-TZ ISO formatting (`toLocalIsoDate`) — `Date.toISOString()` shifts the calendar day
 * by one in positive UTC offsets, which used to make "today" un-selectable.
 *
 * @param   {number} year  - Calendar year.
 * @param   {number} month - Zero-based month index.
 * @returns Array of 42 day cells (previous-month tail + current month + next-month head).
 */
const buildMonthGrid = (year: number, month: number): DayCell[] => {
  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = firstDow - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    cells.push({
      day,
      monthOffset: -1,
      iso: toLocalIsoDate(new Date(year, month - 1, day)),
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      monthOffset: 0,
      iso: toLocalIsoDate(new Date(year, month, day)),
    });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      day: nextDay,
      monthOffset: 1,
      iso: toLocalIsoDate(new Date(year, month + 1, nextDay)),
    });
    nextDay += 1;
  }
  return cells;
};

/**
 * formatHour — formats a 24h hour as `HH.00`.
 *
 * @param   {number} h - Hour (0–23).
 * @returns Slot label string.
 */
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
 * DateTimePickerSheet — two-step bottom-sheet / modal for selecting date and time.
 *
 * Step 1 — calendar, Step 2 — time-slot grid. `Apply` invokes `onApply(date, time)`.
 *
 * @param   {DateTimePickerSheetProps}             props                - Component props.
 * @param   {string}                               [props.date]         - Initially selected date in `yyyy-MM-dd`.
 * @param   {string}                               [props.time]         - Initially selected time in `HH.MM`.
 * @param   {(date: string, time: string) => void} props.onApply        - Apply handler called with the chosen `(date, time)`.
 * @param   {() => void}                           [props.onClose]      - Optional close handler (no close button when omitted).
 * @param   {string}                               [props.minDate]      - Optional minimum allowed date in `yyyy-MM-dd`.
 * @param   {(dateIso: string) => string[]}        [props.getSlots]     - Optional function returning available slot labels for a given date.
 * @param   {[number, number]}                     [props.range]        - Hour range used when `getSlots` is not provided.
 * @param   {1 | 2}                                [props.step]         - Hour step used when `getSlots` is not provided.
 * @param   {string}                               [props.dateTitle]    - Title shown on the date step.
 * @param   {string}                               [props.timeTitle]    - Title shown on the time step.
 * @param   {string}                               [props.applyText]    - Apply button label.
 * @param   {string}                               [props.continueText] - Continue button label.
 * @param   {string}                               [props.noTimeText]   - Empty-state text shown when no slots are available.
 * @returns Portal JSX rendered into `document.body`, or `null` until mounted.
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
}: DateTimePickerSheetProps): JSX.Element | null => {
  const today = useMemo(() => new Date(), []);
  // Parse `yyyy-MM-dd` manually — `new Date("2026-05-12")` is UTC midnight, which shifts to the
  // previous day in negative UTC offsets and would open the wrong month for a pre-selected date.
  const initial = useMemo(() => {
    if (!date) return today;
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return today;
    return new Date(y, m - 1, d);
  }, [date, today]);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(date ?? '');
  const [selectedTime, setSelectedTime] = useState<string>(time ?? '');
  const [stepName, setStepName] = useState<'date' | 'time'>('date');

  // Portal to document.body so the fixed-positioned overlay escapes any ancestor that creates a containing block (transform / filter / backdrop-filter - e.g. CartPopup, ReservationPopup).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Re-run once `mounted` flips: the portal returns `null` on the first render so `wrapperRef.current`
  // is still `null` when `useGSAP` first fires — without `mounted` in deps the targets resolve to
  // `null` and the timeline animates nothing, so the picker visually "just appears".
  useGSAP(() => {
    if (!mounted) return undefined;
    const modalBg = wrapperRef.current?.querySelector('#modalBg') ?? null;
    const modalBody = wrapperRef.current?.querySelector('#modalBody') ?? null;
    if (!modalBg || !modalBody) return undefined;
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
  }, [mounted]);

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

  // Snapshot "now" once per modal open — slot disabled-state is computed against this baseline.
  // Using a moving `new Date()` on every render would flicker disabled-state at minute boundaries.
  const nowMinutes = useMemo(() => today.getHours() * 60 + today.getMinutes(), [today]);
  const todayLocalIso = useMemo(() => toLocalIsoDate(today), [today]);

  /**
   * isSlotPast — whether a `HH.MM` slot is in the past for the currently selected date.
   *
   * Only flips to `true` when the selected date equals "today" in local time; future dates always pass.
   *
   * @param   {string} slot - Slot label in `HH.MM` format (matches `formatHour` and the reservation schedule).
   * @returns `true` when the slot's start time is at or before the local "now" snapshot.
   */
  const isSlotPast = (slot: string): boolean => {
    if (selectedDate !== todayLocalIso) return false;
    const [hStr, mStr] = slot.split('.');
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
    return h * 60 + m <= nowMinutes;
  };

  // Intentionally do NOT reset the selected time when the date changes - the user expects the selection to persist "until I change it".

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
  // If `props.time` was a slot that has since passed, the UI still highlights it (active),
  // but Apply must be blocked — otherwise the caller would receive a stale time.
  const canApply = !!selectedDate && !!selectedTime && !isSlotPast(selectedTime);

  if (!mounted) return null;

  return createPortal(
    <div ref={wrapperRef} className="z-500 fixed inset-0 flex h-screen w-full">
      <div
        id="modalBg"
        className="fixed inset-0 size-full min-w-full min-h-full bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-dvh w-full flex-col rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 backdrop-blur-card shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-h-[90vh] md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
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
          <h2 className="flex-1 text-center font-bold text-xl uppercase text-brand">
            {isDateStep ? dateTitle : timeTitle}
          </h2>
          {onClose ? (
            // Picker owns its own X on all breakpoints. Relying on the bottom-menu's CenterCloseButton on
            // mobile would dispatch `setTransition('close')` on the host `OpenDrawerContext` (Cart /
            // Reservation popup), which closes the host instead of just the picker.
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
                  <h2 className="font-semibold text-xl text-brand">{MONTH_NAMES[month]}</h2>
                  <h3 className="font-light text-xl text-brand">{year}</h3>
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
                    const past = isSlotPast(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={past}
                        onClick={() => setSelectedTime(slot)}
                        className={
                          'service_time ' +
                          (active ? 'border-brand text-brand font-extrabold ' : '') +
                          (past ? 'opacity-40 pointer-events-none ' : '')
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
              className="block rounded-card border border-brand px-3.75 py-1.25 font-bold text-xl text-brand hover_btn_brand disabled:opacity-60"
            >
              {continueText}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canApply}
              onClick={handleApply}
              className="block rounded-card border border-brand px-3.75 py-1.25 font-bold text-xl text-brand hover_btn_brand disabled:opacity-60"
            >
              {applyText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DateTimePickerSheet;
