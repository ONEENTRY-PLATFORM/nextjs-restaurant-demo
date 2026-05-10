'use client';

import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGetChildPagesByParentUrlQuery, useGetFormByMarkerQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import { consumePendingReservationEdit, type PendingReservationEdit } from './reservationEditState';
import ReservationForm, { type AuthSubStep, type ReservationStep } from './ReservationForm';
import {
  consumePendingReservationResume,
  type ReservationOAuthResume,
} from './reservationOAuthResumeState';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';

/**
 * buildInitialValuesFromOrder — converts `order.formData` into a flat set of initialValues for ReservationForm.
 *
 * @param   {IOrdersFormData[]}    formData    - Raw order fields.
 * @param   {RestaurantOption[]}   restaurants - Available options for mapping entity → pageUrl.
 * @returns Flat map of initial values keyed by marker.
 */
const buildInitialValuesFromOrder = (
  formData: IOrdersFormData[],
  restaurants: RestaurantOption[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const item of formData) {
    const { marker, type, value } = item;
    if (type === 'string' || type === 'integer' || type === 'real' || type === 'float') {
      result[marker] = value == null ? '' : String(value);
    } else if (type === 'text') {
      const arr = Array.isArray(value) ? (value as Array<{ plainValue?: string }>) : [];
      result[marker] = arr[0]?.plainValue ?? '';
    } else if (type === 'entity') {
      const ids = Array.isArray(value) ? (value as number[]) : [];
      const id = ids[0];
      const opt = id != null ? restaurants.find(r => r.id === id) : undefined;
      if (opt) result[marker] = opt.value;
    } else if (type === 'timeInterval') {
      const arr = Array.isArray(value) ? (value as Array<[string, string]>) : [];
      const first = arr[0];
      if (first && first[0]) {
        const start = new Date(first[0]);
        const yyyy = start.getUTCFullYear();
        const mm = String(start.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(start.getUTCDate()).padStart(2, '0');
        const hh = String(start.getUTCHours()).padStart(2, '0');
        const min = String(start.getUTCMinutes()).padStart(2, '0');
        result[marker] = `${yyyy}-${mm}-${dd} ${hh}.${min}`;
      }
    } else if (type === 'date') {
      const v = value as { fullDate?: string } | undefined;
      if (v?.fullDate) result[marker] = v.fullDate.slice(0, 10);
    }
  }
  return result;
};

/**
 * ReservationPopup — table booking popup with form / edit / OAuth resume modes.
 *
 * @returns JSX of the reservation drawer.
 */
const ReservationPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, action, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'ReservationPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const close = () => setTransition('close');

  const { data: form, isLoading: isFormLoading } = useGetFormByMarkerQuery(
    { marker: 'booking_order' },
    { skip: !isOpen }
  );
  const { data: pages, isLoading: isPagesLoading } = useGetChildPagesByParentUrlQuery(
    { url: 'restaurants' },
    { skip: !isOpen }
  );

  const restaurants: RestaurantOption[] = useMemo(
    () =>
      (pages ?? []).map((p: IPagesEntity) => {
        const scheduleRaw = p.attributeValues?.schedule?.value;
        const scheduleEntries: ScheduleSlotEntry[] = Array.isArray(scheduleRaw)
          ? (scheduleRaw as Array<{ values?: ScheduleSlotEntry[] }>).flatMap(
              group => group?.values ?? []
            )
          : [];
        return {
          value: p.pageUrl ?? String(p.id),
          id: p.id,
          label:
            ((p.attributeValues?.address?.value as string | undefined) || p.localizeInfos?.title) ??
            'Restaurant',
          schedule: scheduleEntries,
        };
      }),
    [pages]
  );

  // Edit mode: pending data from reservationEditState -> ReservationForm will call updateOrderByMarkerAndId.
  const [editing, setEditing] = useState<PendingReservationEdit | null>(null);
  // Resume mode: restore form values after the OAuth redirect (sessionStorage).
  const [resume, setResume] = useState<ReservationOAuthResume | null>(null);
  // Wizard step lifted from ReservationForm so the popup header arrow can navigate back
  // (auth/payment -> form, email -> providers); reset on close.
  const [step, setStep] = useState<ReservationStep>({ kind: 'form' });
  const [authSubStep, setAuthSubStep] = useState<AuthSubStep>('providers');
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(consumePendingReservationEdit());
      setResume(consumePendingReservationResume());
    } else {
      setEditing(null);
      setResume(null);
      setStep({ kind: 'form' });
      setAuthSubStep('providers');
    }
  }, [isOpen]);

  /**
   * handleHeaderBack — header arrow navigation: walks the wizard back one step,
   * or closes the popup when on the first step / a terminal step.
   *
   * @returns
   */
  const handleHeaderBack = (): void => {
    if (step.kind === 'auth') {
      if (authSubStep === 'email') {
        setAuthSubStep('providers');
        return;
      }
      setStep({ kind: 'form' });
      return;
    }
    if (step.kind === 'payment') {
      setStep({ kind: 'form' });
      setAuthSubStep('providers');
      return;
    }
    close();
  };

  const initialValues = useMemo(() => {
    if (editing) {
      return buildInitialValuesFromOrder(editing.formData, restaurants);
    }
    if (resume) {
      return resume.values;
    }
    return action ? { restaurant: action } : undefined;
  }, [action, editing, resume, restaurants]);

  const isLoading = isFormLoading || isPagesLoading;

  return (
    <DrawerAnimations component="ReservationPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 min-h-162.5 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 backdrop-blur-card shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-150 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={handleHeaderBack}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-semibold text-2xl text-brand">
            {t('reservation_default_title', 'Reservation')}
          </p>
          {/* Close lives in the bottom-menu on mobile (CenterCloseButton); show only md+. */}
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close reservation"
            className="max-md:hidden"
          />
          <span aria-hidden="true" className="size-11.5 md:hidden" />
        </div>

        {isLoading ? (
          <div className="mt-15 flex w-full justify-center">
            <Loader />
          </div>
        ) : !form ? (
          <div className="mt-10 rounded-xl bg-ink/60 p-6 text-center text-paper/80">
            {t('reservation_form_unavailable', 'Reservation form is unavailable.')}
          </div>
        ) : (
          <div className="mt-7.5">
            <ReservationForm
              // `key` forces a form remount when edit/resume values arrive on the second render.
              key={editing?.orderId ?? (resume ? 'oauth-resume' : 'fresh')}
              form={form}
              restaurants={restaurants}
              initialValues={initialValues}
              editingOrder={editing}
              onClose={close}
              step={step}
              setStep={setStep}
              authSubStep={authSubStep}
              setAuthSubStep={setAuthSubStep}
            />
          </div>
        )}
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default ReservationPopup;
