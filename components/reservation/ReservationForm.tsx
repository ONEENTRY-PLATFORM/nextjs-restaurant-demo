'use client';

import type { IFormAttribute, IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi, isError } from '@/app/api';
import { useEnterpriseCaptcha } from '@/app/hooks/useEnterpriseCaptcha';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { FORMS } from '@/app/utils/constants';
import { toLocalIsoDate } from '@/app/utils/formatDate';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

import FormFieldAnimations from '../forms/animations/FormFieldAnimations';
import ErrorMessage from '../forms/inputs/ErrorMessage';
import ReservationAuthStep from './ReservationAuthStep';
import ReservationField from './ReservationField';
import {
  buildFormRows,
  buildTimeIntervalValue,
  formatBookingSummary,
  getAvailableSlotsForDate,
  RESTAURANT_MARKER,
  TIME_SLOT_MARKER,
  validateField,
} from './reservationFormUtils';
import ReservationPaymentStep from './ReservationPaymentStep';
import ReservationSuccess from './ReservationSuccess';
import type { AuthSubStep, FieldValue, FormRow, ReservationStep } from './reservationTypes';
import type { RestaurantOption } from './RestaurantSelect';
import RestaurantSelect from './RestaurantSelect';

type ReservationFormProps = {
  form: IFormsEntity;
  restaurants?: RestaurantOption[] | undefined;
  initialValues?: Record<string, FieldValue> | undefined;
  editingOrder?:
    | {
        orderId: number;
        paymentAccountIdentifier: string;
        formIdentifier: string;
      }
    | null
    | undefined;
  onClose?: () => void;
  step: ReservationStep;
  setStep: (step: ReservationStep) => void;
  authSubStep: AuthSubStep;
  setAuthSubStep: (s: AuthSubStep) => void;
};

/**
 * ReservationForm — table-booking form (`booking_order`) with create/edit + auth + payment wizard.
 *
 * @param   {ReservationFormProps}                       props                  - Component props.
 * @param   {IFormsEntity}                               props.form             - OneEntry form entity that defines the field schema.
 * @param   {RestaurantOption[]}                         [props.restaurants]    - Available restaurant options for the entity dropdown.
 * @param   {Record<string, FieldValue>}                 [props.initialValues]  - Optional pre-filled values (used for edit / OAuth resume).
 * @param   {object | null}                              [props.editingOrder]   - When set, the form updates this order instead of creating a new one.
 * @param   {() => void}                                 [props.onClose]        - Callback invoked on successful update (closes the popup).
 * @param   {ReservationStep}                            props.step             - Current wizard step (controlled by parent).
 * @param   {(step: ReservationStep) => void}            props.setStep          - Setter for the wizard step (controlled by parent).
 * @param   {AuthSubStep}                                props.authSubStep      - Current auth sub-step (controlled by parent).
 * @param   {(s: AuthSubStep) => void}                   props.setAuthSubStep   - Setter for the auth sub-step (controlled by parent).
 * @returns JSX of the form, auth step, payment step, or success screen depending on wizard state.
 */
const ReservationForm = ({
  form,
  restaurants = [],
  initialValues,
  editingOrder,
  onClose,
  step,
  setStep,
  authSubStep,
  setAuthSubStep,
}: ReservationFormProps): JSX.Element => {
  const t = useT();
  const { isAuth } = useContext(AuthContext);
  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const attrs = useMemo<IFormAttribute[]>(
    () => (form?.attributes ? [...form.attributes].sort((a, b) => a.position - b.position) : []),
    [form]
  );

  const rows = useMemo<FormRow[]>(() => buildFormRows(attrs), [attrs]);

  const spamAttr = useMemo(() => attrs.find(a => a.type === 'spam'), [attrs]);
  const spamSettings = spamAttr?.settings as
    | { captcha?: { key?: string; action?: string } }
    | undefined;
  const captcha = useEnterpriseCaptcha(spamSettings?.captcha?.key, spamSettings?.captcha?.action);

  const onChange = (marker: string, value: FieldValue) => {
    setValues(prev => ({ ...prev, [marker]: value }));
    setErrors(prev => {
      if (!prev[marker]) return prev;
      const next = { ...prev };
      delete next[marker];
      return next;
    });
  };

  const buildPayload = (): IOrdersFormData[] => {
    return attrs
      .filter(attr => attr.type !== 'button')
      .map(attr => {
        if (attr.type === 'spam') {
          return {
            marker: attr.marker,
            type: 'spam',
            value: captcha,
          } as unknown as IOrdersFormData;
        }
        const raw = values[attr.marker] ?? '';
        if (attr.type === 'text') {
          // OneEntry: "Only one of htmlValue, plainValue or mdValue can be provided".
          return {
            marker: attr.marker,
            type: 'text',
            value: [{ plainValue: raw }],
          };
        }
        if (attr.type === 'entity') {
          const opt = restaurants.find(r => r.value === raw);
          return {
            marker: attr.marker,
            type: 'entity',
            value: opt ? [opt.id] : [],
          };
        }
        if (attr.type === 'date') {
          const d = raw ? new Date(raw) : new Date();
          return {
            marker: attr.marker,
            type: 'date',
            value: {
              fullDate: d.toISOString(),
              formattedValue: d.toDateString() + ' 00:00',
              formatString: 'YYYY-MM-DD',
            },
          };
        }
        if (attr.type === 'timeInterval') {
          const interval = buildTimeIntervalValue(raw, values[RESTAURANT_MARKER], restaurants);
          return {
            marker: attr.marker,
            type: 'timeInterval',
            value: interval,
          };
        }
        return {
          marker: attr.marker,
          type: attr.type === 'integer' ? 'integer' : 'string',
          value: raw,
        };
      });
  };

  // Step 1: validate the form.
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (spamAttr && !captcha) {
      setError('Please wait while captcha is loading.');
      return;
    }

    const nextErrors: Record<string, string> = {};
    for (const attr of attrs) {
      if (attr.type === 'button' || attr.type === 'spam') continue;
      const message = validateField(attr, values[attr.marker] ?? '', t);
      if (message) nextErrors[attr.marker] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('');
      return;
    }

    setError('');
    const payload = buildPayload();
    const summary = formatBookingSummary(values);

    if (editingOrder) {
      setLoading(true);
      try {
        const res = await getApi().Orders.updateOrderByMarkerAndId(
          FORMS.bookingOrder,
          editingOrder.orderId,
          {
            formIdentifier: editingOrder.formIdentifier,
            paymentAccountIdentifier: editingOrder.paymentAccountIdentifier,
            formData: payload,
            products: [{ productId: 34, quantity: 1 }],
          }
        );
        setLoading(false);
        if (isError(res)) {
          setError((res as { message?: string }).message ?? 'Failed to update reservation');
          return;
        }
        toast(t('booking_updated_toast', 'Reservation updated.'));
        onClose?.();
      } catch (err) {
        setLoading(false);
        setError((err as Error).message || 'Failed to update reservation');
      }
      return;
    }

    setStep(
      isAuth
        ? { kind: 'payment', formData: payload, summary }
        : { kind: 'auth', formData: payload, summary }
    );
  };

  // Step 2: the user picked a payment method - create the order.
  const onApplyPayment = async (paymentAccountIdentifier: string) => {
    if (step.kind !== 'payment') return;
    setLoading(true);
    setError('');
    try {
      const res = await getApi().Orders.createOrder(FORMS.bookingOrder, {
        formIdentifier: FORMS.bookingOrder,
        paymentAccountIdentifier,
        formData: step.formData,
        products: [{ productId: 34, quantity: 1 }],
      });
      if (isError(res)) {
        setLoading(false);
        setError((res as { message?: string }).message ?? 'Failed to submit reservation');
        return;
      }
      const { id } = res as { id: number };

      // Online -> open a payment session and redirect. Cash accounts return paymentUrl=null
      // and fall through to the success branch shown inside the popup.
      if (paymentAccountIdentifier !== 'cash') {
        try {
          const session = await getApi().Payments.createSession(id, 'session');
          if (!isError(session)) {
            const url = (session as { paymentUrl?: string | null }).paymentUrl;
            if (url) {
              window.location.href = url;
              return;
            }
          }
        } catch {
          // Swallow - the order is already created, we still proceed to success.
        }
      }

      setLoading(false);
      setStep({ kind: 'success', orderId: id, summary: step.summary });
      setValues({});
    } catch (err) {
      setLoading(false);
      setError((err as Error).message || 'Failed to submit reservation');
    }
  };

  if (step.kind === 'success') {
    return <ReservationSuccess orderId={step.orderId} summary={step.summary} />;
  }

  if (step.kind === 'auth') {
    return (
      <ReservationAuthStep
        currentValues={values}
        onAuthSuccess={() => {
          setError('');
          setStep({ kind: 'payment', formData: step.formData, summary: step.summary });
        }}
        subStep={authSubStep}
        setSubStep={setAuthSubStep}
      />
    );
  }

  if (step.kind === 'payment') {
    const selectedRestaurant = restaurants.find(r => r.value === values[RESTAURANT_MARKER]);
    return (
      <ReservationPaymentStep
        onApply={onApplyPayment}
        isLoading={loading}
        error={error}
        bookingPolicy={selectedRestaurant?.bookingPolicy ?? ''}
      />
    );
  }

  const todayIso = toLocalIsoDate();

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-5 px-5 md:px-0" noValidate>
      {rows.map((row, i) => {
        if (row.kind === 'full') {
          const { attr } = row;
          if (attr.type === 'entity') {
            if (attr.marker !== RESTAURANT_MARKER || restaurants.length === 0) return null;
            return (
              <FormFieldAnimations key={attr.marker} index={i} className="flex flex-col gap-1 z-50">
                <RestaurantSelect
                  options={restaurants}
                  value={values[RESTAURANT_MARKER] ?? ''}
                  onChange={v => onChange(RESTAURANT_MARKER, v)}
                  placeholder={String(attr.additionalFields?.placeholder?.value ?? '')}
                />
                {errors[attr.marker] ? (
                  <span className="px-4 text-sm text-red-500">{errors[attr.marker]}</span>
                ) : null}
              </FormFieldAnimations>
            );
          }
          return (
            <FormFieldAnimations key={attr.marker} index={i} className="">
              <ReservationField
                attr={attr}
                values={values}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
                error={errors[attr.marker] ?? null}
              />
            </FormFieldAnimations>
          );
        }
        return (
          <FormFieldAnimations key={`row-${i}`} index={i} className="flex justify-between gap-3.75">
            <ReservationField
              attr={row.left}
              values={values}
              onChange={onChange}
              onOpenPicker={() => setPickerOpen(true)}
              error={errors[row.left.marker] ?? null}
            />
            {row.right ? (
              <ReservationField
                attr={row.right}
                values={values}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
                error={errors[row.right.marker] ?? null}
              />
            ) : (
              <div className="flex-1" />
            )}
          </FormFieldAnimations>
        );
      })}

      {/* Primary submit button */}
      <FormFieldAnimations
        index={rows.length}
        className="mt-7.5 flex flex-col items-center justify-center gap-5"
      >
        <button
          type="submit"
          disabled={loading}
          className="flex h-9.25 w-31.25 items-center justify-center rounded-card bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-card hover_btn_transp disabled:opacity-60"
        >
          {t('continue_text', 'Continue')}
        </button>
      </FormFieldAnimations>

      {error ? <ErrorMessage error={error} /> : null}

      {pickerOpen ? (
        <DateTimePickerSheet
          date={values[TIME_SLOT_MARKER]?.split(' ')?.[0] || ''}
          time={values[TIME_SLOT_MARKER]?.split(' ')?.[1] || ''}
          minDate={todayIso}
          getSlots={dateIso =>
            getAvailableSlotsForDate(
              restaurants.find(r => r.value === (values[RESTAURANT_MARKER] ?? ''))?.schedule,
              dateIso
            )
          }
          onApply={(d, tm) => {
            onChange(TIME_SLOT_MARKER, `${d} ${tm}`);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
          dateTitle={t('date_text', 'Date')}
          timeTitle={t('time_text', 'Time')}
          applyText={t('apply_text', '') || undefined}
          continueText={t('continue_text', '') || undefined}
          noTimeText={t('no_time_text', '') || undefined}
        />
      ) : null}
    </form>
  );
};

export default ReservationForm;
