'use client';

import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGetChildPagesByParentUrlQuery, useGetFormByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS, PAGES } from '@/app/utils/constants';
import { PHONE_MARKERS } from '@/components/cart/steps/step-payment/constants';
import { findUserField } from '@/components/cart/steps/step-payment/userFields';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Spinner from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import { consumePendingReservationEdit, type PendingReservationEdit } from './reservationEditState';
import ReservationForm from './ReservationForm';
import {
  consumePendingReservationResume,
  type ReservationOAuthResume,
} from './reservationOAuthResumeState';
import type { AuthSubStep, ReservationStep } from './reservationTypes';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';

const NAME_MARKERS = ['name', 'first_name', 'firstname'] as const;
const SURNAME_MARKERS = ['surname', 'last_name', 'lastname', 'family_name'] as const;
const EMAIL_MARKERS = ['email'] as const;

/**
 * buildUserPrefill — extracts overlap fields (name, surname, phone, email) from the authenticated user's profile so the booking form opens pre-filled.
 *
 * @param   {IUserEntity | undefined} user - Authenticated user, or `undefined` for guests.
 * @returns Map of `booking_order` markers → string values to seed `initialValues`.
 */
const buildUserPrefill = (user: IUserEntity | undefined): Record<string, string> => {
  if (!user?.formData) return {};
  const out: Record<string, string> = {};
  const name = findUserField(user.formData, NAME_MARKERS);
  const surname = findUserField(user.formData, SURNAME_MARKERS);
  const phone = findUserField(user.formData, PHONE_MARKERS);
  const email = findUserField(user.formData, EMAIL_MARKERS);
  if (name) out.name = name;
  if (surname) out.surname = surname;
  if (phone) out.phone = phone;
  if (email) out.email = email;
  return out;
};

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
  const { user } = useContext(AuthContext);
  const isOpen = open && component === 'ReservationPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useSwipeToClose(sheetRef, () => setOpen(false));

  const close = () => setTransition('close');

  const { data: form, isLoading: isFormLoading } = useGetFormByMarkerQuery(
    { marker: FORMS.bookingOrder },
    { skip: !isOpen }
  );
  const { data: pages, isLoading: isPagesLoading } = useGetChildPagesByParentUrlQuery(
    { url: PAGES.restaurants },
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
          bookingPolicy: (p.attributeValues?.booking_policy?.value as string | undefined) ?? '',
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
      const authParents: Partial<Record<AuthSubStep, AuthSubStep>> = {
        'sign-in': 'providers',
        'sign-up': 'sign-in',
        'forgot-password': 'sign-in',
        'verification-otp': 'forgot-password',
        'verification-activate': 'sign-up',
        'reset-password': 'sign-in',
      };
      const parent = authParents[authSubStep];
      if (parent) {
        setAuthSubStep(parent);
        return;
      }
      // 'providers' → back to the form step
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
    const prefill = buildUserPrefill(user);
    if (action) prefill.restaurant = action;
    return Object.keys(prefill).length > 0 ? prefill : undefined;
  }, [action, editing, resume, restaurants, user]);

  const isLoading = isFormLoading || isPagesLoading;

  return (
    <DrawerAnimations component="ReservationPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-20 flex max-h-dvh min-h-162.5 w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 shadow-xl backdrop-blur-card md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:h-auto md:max-h-[90vh] md:max-w-150 md:-translate-1/2 md:rounded-[20px] md:p-10"
      >
        <div className="flex items-center justify-between gap-5">
          {step.kind === 'form' ? (
            <span aria-hidden="true" className="size-11.5" />
          ) : (
            <button
              type="button"
              onClick={handleHeaderBack}
              aria-label={t('back_text', 'Back')}
              className="group flex items-center justify-center"
            >
              <ArrowBackIcon className="hover-target text-paper" />
            </button>
          )}
          <p className="text-2xl font-semibold text-brand">
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
            <Spinner />
          </div>
        ) : !form ? (
          <div className="mt-10 rounded-xl bg-ink/60 p-6 text-center text-paper/80">
            {t('reservation_form_unavailable', 'Reservation form is unavailable.')}
          </div>
        ) : (
          <div className="mt-7.5">
            <ReservationForm
              // `key` forces a form remount when edit/resume/user-prefill values arrive after the
              // first render (e.g. user is hydrated async via AuthContext polling).
              key={
                editing?.orderId ??
                (resume ? 'oauth-resume' : user?.id ? `user-${user.id}` : 'fresh')
              }
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
