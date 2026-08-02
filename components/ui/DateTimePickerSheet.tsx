'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX } from 'react';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { toLocalIsoDate } from '@/app/utils/formatDate';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import DateTimePickerCalendar from '@/components/ui/DateTimePickerCalendar';
import DateTimePickerTimeGrid from '@/components/ui/DateTimePickerTimeGrid';
import { buildMonthGrid, formatHour } from '@/components/ui/dateTimePickerUtils';

type DateTimePickerSheetProps = {
  date?: string;
  time?: string;
  onApply: (date: string, time: string) => void;
  onClose?: () => void;
  minDate?: string;
  getSlots?: ((dateIso: string) => string[]) | undefined;
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
  // Mount-gate via useSyncExternalStore: `document.body` exists only on the client.
  const mounted = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isFirstStepAnimRef = useRef(true);

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

  // Stagger reveal for calendar cells / time slots. Fires on initial open AND on step switch —
  // useGSAP auto-kills the previous tween when `stepName` changes, so we never leak in-flight
  // animations onto unmounted items. First run waits for the body to start sliding in (delay 0.3);
  // subsequent step switches animate immediately since the body is already on-screen.
  useGSAP(() => {
    if (!mounted) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const items = wrapper.querySelectorAll<HTMLElement>('[data-anim="dt-item"]');
    if (items.length === 0) return;

    const delay = isFirstStepAnimRef.current ? 0.45 : 0;
    isFirstStepAnimRef.current = false;

    gsap.fromTo(
      items,
      { scale: 0.5, autoAlpha: 0 },
      {
        scale: 1,
        // Per-item endpoint: disabled cells (past dates, neighbor months, past time slots) end at
        // 0.4 to match the Tailwind `opacity-40` class. Without this, GSAP's inline `opacity: 1`
        // would override the class and disabled cells would look fully opaque after the animation.
        autoAlpha: (_i, el) => ((el as HTMLElement).hasAttribute('data-disabled') ? 0.4 : 1),
        duration: 0.525,
        ease: 'power2.out',
        stagger: { amount: 0.525, from: 'start' },
        delay,
      }
    );
  }, [mounted, stepName]);

  /**
   * animateAndRun — plays the close choreography (stagger-out of inner items + reverse of bg/body
   * timeline) and invokes `cb` once the body timeline has finished reversing.
   *
   * @param   {() => void} cb - Callback fired after the close animation completes (typically
   *                            `onClose` or `() => onApply(date, time)`).
   * @returns Nothing.
   */
  const animateAndRun = (cb: () => void): void => {
    const tl = tlRef.current;
    if (!tl) {
      cb();
      return;
    }
    const wrapper = wrapperRef.current;
    const items = wrapper?.querySelectorAll<HTMLElement>('[data-anim="dt-item"]');
    if (items && items.length > 0) {
      gsap.to(items, {
        scale: 0.5,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        stagger: { amount: 0.3, from: 'end' },
      });
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
    <div ref={wrapperRef} className="fixed inset-0 z-500 flex h-screen w-full">
      <div
        id="modalBg"
        className="fixed inset-0 size-full min-h-full min-w-full bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        id="modalBody"
        className="fixed inset-x-0 bottom-0 z-20 flex max-h-dvh w-full flex-col rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 shadow-xl backdrop-blur-card md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:h-auto md:max-h-[90vh] md:max-w-150 md:-translate-1/2 md:rounded-[20px] md:p-10"
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
          <h2 className="flex-1 text-center text-xl font-bold text-brand uppercase">
            {isDateStep ? dateTitle : timeTitle}
          </h2>
          {onClose ? (
            // Picker owns its own X on all breakpoints. Relying on the bottom-menu's CenterCloseButton on
            // mobile would dispatch `setTransition('close')` on the host `OpenDrawerContext` (Cart /
            // Reservation popup), which closes the host instead of just the picker.
            <ClosePopupButton onClose={handleClose} ariaLabel="Close date and time picker" />
          ) : (
            <span className="size-5" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {isDateStep ? (
            <DateTimePickerCalendar
              grid={grid}
              selectedDate={selectedDate}
              minDate={minDate}
              month={month}
              year={year}
              onSelectDate={setSelectedDate}
              onPrevMonth={goPrev}
              onNextMonth={goNext}
            />
          ) : (
            <DateTimePickerTimeGrid
              slots={slots}
              selectedTime={selectedTime}
              isSlotPast={isSlotPast}
              onSelectTime={setSelectedTime}
              noTimeText={noTimeText}
            />
          )}
        </div>

        <div className="mt-5 flex items-center justify-center">
          {isDateStep ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStepName('time')}
              className="hover_btn_brand block rounded-card border border-brand px-3.75 py-1.25 text-xl font-bold text-brand disabled:opacity-60"
            >
              {continueText}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canApply}
              onClick={handleApply}
              className="hover_btn_brand block rounded-card border border-brand px-3.75 py-1.25 text-xl font-bold text-brand disabled:opacity-60"
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
