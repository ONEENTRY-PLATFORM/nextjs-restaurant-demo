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
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import ReservationAuthStep from './ReservationAuthStep';
import ReservationPaymentStep from './ReservationPaymentStep';
import ReservationSuccess from './ReservationSuccess';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';
import RestaurantSelect from './RestaurantSelect';

type FieldValue = string;

/**
 * ROW_PAIRS — fields used for the two-column rows per `service_table.html` markup (form `booking_order`).
 */
const ROW_PAIRS: Array<[string, string]> = [
  ['name', 'surname'],
  ['phone', 'people_count'],
];

const TEXT_MARKER = 'user_preferences';
const RESTAURANT_MARKER = 'restaurant';
const TIME_SLOT_MARKER = 'time_slot';

/**
 * getAvailableSlotsForDate — available `HH.MM` slot starts for a date, based on the restaurant schedule.
 *
 * @param   {ScheduleSlotEntry[] | undefined} schedule - Raw entries from `schedule.value`.
 * @param   {string}                          dateIso  - Selected date `yyyy-MM-dd`.
 * @returns Sorted list of slot labels (`HH.MM`).
 */
const getAvailableSlotsForDate = (
  schedule: ScheduleSlotEntry[] | undefined,
  dateIso: string
): string[] => {
  if (!schedule || schedule.length === 0 || !dateIso) return [];
  const target = new Date(`${dateIso}T00:00:00.000Z`).getTime();
  const result = new Set<string>();
  for (const entry of schedule) {
    let applies = false;
    if (entry.inEveryWeek || entry.inEveryMonth) {
      applies = true;
    } else if (entry.dates && entry.dates.length === 2) {
      const start = new Date(entry.dates[0]).getTime();
      const end = new Date(entry.dates[1]).getTime();
      applies = target >= start && target <= end;
    }
    if (!applies || !entry.times) continue;
    for (const [from] of entry.times) {
      const hh = String(from.hours).padStart(2, '0');
      const mm = String(from.minutes).padStart(2, '0');
      result.add(`${hh}.${mm}`);
    }
  }
  return [...result].sort();
};

/**
 * buildTimeIntervalValue — converts the selected slot (`yyyy-MM-dd HH.MM`) into the OneEntry `timeInterval` shape.
 *
 * @param   {string}              raw             - Value of the `time_slot` field.
 * @param   {string | undefined}  restaurantValue - Current `restaurant` value (page url).
 * @param   {RestaurantOption[]}  restaurants     - Available restaurant options.
 * @returns Intervals ready to submit (one entry); empty array on invalid input.
 */
const buildTimeIntervalValue = (
  raw: string,
  restaurantValue: string | undefined,
  restaurants: RestaurantOption[]
): Array<[string, string]> => {
  if (!raw) return [];
  const [dateIso, slotStr] = raw.split(' ');
  if (!dateIso || !slotStr) return [];
  const [hhStr, mmStr] = slotStr.split('.');
  if (!hhStr || !mmStr) return [];
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return [];

  const makeIso = (h: number, m: number): string => {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  };

  const schedule = restaurants.find(r => r.value === restaurantValue)?.schedule ?? [];
  const target = new Date(`${dateIso}T00:00:00.000Z`).getTime();
  for (const entry of schedule) {
    let applies = false;
    if (entry.inEveryWeek || entry.inEveryMonth) applies = true;
    else if (entry.dates && entry.dates.length === 2) {
      const start = new Date(entry.dates[0]).getTime();
      const end = new Date(entry.dates[1]).getTime();
      applies = target >= start && target <= end;
    }
    if (!applies || !entry.times) continue;
    for (const [from, to] of entry.times) {
      if (from.hours === hh && from.minutes === mm) {
        return [[makeIso(from.hours, from.minutes), makeIso(to.hours, to.minutes)]];
      }
    }
  }

  return [[makeIso(hh, mm), makeIso((hh + 1) % 24, mm)]];
};

/**
 * resolveInputType — maps a OneEntry form attribute type + marker to a native HTML input `type`.
 *
 * @param   {string} type   - OneEntry attribute `type`.
 * @param   {string} marker - Attribute marker used as a heuristic.
 * @returns HTML input type (`number` / `email` / `tel` / `password` / `text`).
 */
const resolveInputType = (type: string, marker: string): string => {
  if (type === 'integer' || type === 'real' || type === 'float') return 'number';
  if (marker.includes('email')) return 'email';
  if (marker.includes('phone') || marker.includes('tel')) return 'tel';
  if (marker.includes('password')) return 'password';
  return 'text';
};

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

export type ReservationStep =
  | { kind: 'form' }
  | { kind: 'auth'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'payment'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'success'; orderId: number; summary: string };

export type AuthSubStep = 'providers' | 'email';

/**
 * formatBookingSummary — formats the booking summary as `DD.MM.YY HH.MM N person`.
 *
 * @param   {Record<string, string>} values - Form field values keyed by marker.
 * @returns Summary string for the success screen (parts may be omitted when missing).
 */
const formatBookingSummary = (values: Record<string, string>): string => {
  const slot = values[TIME_SLOT_MARKER] ?? '';
  const [dateIso, time] = slot.split(' ');
  let datePart = '';
  if (dateIso) {
    const [yyyy, mm, dd] = dateIso.split('-');
    if (yyyy && mm && dd) datePart = `${dd}.${mm}.${yyyy.slice(2)}`;
  }
  const timePart = time ?? '';
  const peopleRaw = values['people_count'] ?? '';
  const peopleNum = Number(peopleRaw);
  const peoplePart = !Number.isNaN(peopleNum) && peopleNum > 0 ? `${peopleNum} person` : '';
  return [datePart, timePart, peoplePart].filter(Boolean).join(' ');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const attrs = useMemo<IFormAttribute[]>(
    () => (form?.attributes ? [...form.attributes].sort((a, b) => a.position - b.position) : []),
    [form]
  );

  const attrByMarker = useMemo(() => {
    const map = new Map<string, IFormAttribute>();
    for (const a of attrs) map.set(a.marker, a);
    return map;
  }, [attrs]);

  const spamAttr = useMemo(() => attrs.find(a => a.type === 'spam'), [attrs]);
  const spamSettings = spamAttr?.settings as
    | { captcha?: { key?: string; action?: string } }
    | undefined;
  const captcha = useEnterpriseCaptcha(spamSettings?.captcha?.key, spamSettings?.captcha?.action);

  const onChange = (marker: string, value: FieldValue) => {
    setValues(prev => ({ ...prev, [marker]: value }));
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
    setError('');
    const payload = buildPayload();
    const summary = formatBookingSummary(values);

    if (editingOrder) {
      setLoading(true);
      try {
        const res = await getApi().Orders.updateOrderByMarkerAndId(
          'booking_order',
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
      const res = await getApi().Orders.createOrder('booking_order', {
        formIdentifier: 'booking_order',
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
    return <ReservationPaymentStep onApply={onApplyPayment} isLoading={loading} error={error} />;
  }

  const hasNotes = attrByMarker.has(TEXT_MARKER);
  const hasRestaurant = attrByMarker.has(RESTAURANT_MARKER) && restaurants.length > 0;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-5 px-5 md:px-0">
      {hasRestaurant ? (
        <RestaurantSelect
          options={restaurants}
          value={values[RESTAURANT_MARKER] ?? ''}
          onChange={v => onChange(RESTAURANT_MARKER, v)}
          placeholder="Restaurant choosing"
        />
      ) : null}

      {/* Two-column rows */}
      {ROW_PAIRS.map(([left, right]) => {
        const leftAttr = attrByMarker.get(left);
        const rightAttr = attrByMarker.get(right);
        if (!leftAttr && !rightAttr) return null;
        return (
          <div key={left + right} className="flex justify-between gap-3.75">
            {leftAttr ? (
              <Field
                attr={leftAttr}
                values={values}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
              />
            ) : (
              <div />
            )}
            {rightAttr ? (
              <Field
                attr={rightAttr}
                values={values}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
              />
            ) : (
              <div />
            )}
          </div>
        );
      })}

      {/* Preferences textarea (full width) */}
      {hasNotes ? (
        <div className="flex flex-col border-b border-b-muted">
          <label htmlFor={TEXT_MARKER} className="font-normal text-base text-paper">
            {attrByMarker.get(TEXT_MARKER)?.localizeInfos?.title ??
              t('preferences_text', 'Preferences')}
          </label>
          <textarea
            id={TEXT_MARKER}
            name={TEXT_MARKER}
            value={values[TEXT_MARKER] ?? ''}
            onChange={ev => onChange(TEXT_MARKER, ev.currentTarget.value)}
            className="cart_input resize-none w-full"
            rows={4}
          />
        </div>
      ) : null}

      {/* All remaining fields not placed in the grid above (fallback) */}
      {attrs
        .filter(
          a =>
            a.type !== 'spam' &&
            a.type !== 'button' &&
            a.marker !== TEXT_MARKER &&
            a.marker !== RESTAURANT_MARKER &&
            !ROW_PAIRS.flat().includes(a.marker)
        )
        .map(a => (
          <Field
            key={a.marker}
            attr={a}
            values={values}
            onChange={onChange}
            onOpenPicker={() => setPickerOpen(true)}
          />
        ))}

      {/* Primary submit button */}
      <div className="mt-7.5 flex flex-col items-center justify-center gap-5">
        <button
          type="submit"
          disabled={loading}
          className="flex h-9.25 w-31.25 items-center justify-center rounded-card bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-card hover_btn_transp disabled:opacity-60"
        >
          {t('continue_text', 'Continue')}
        </button>
      </div>

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

type FieldProps = {
  attr: IFormAttribute;
  values: Record<string, FieldValue>;
  onChange: (marker: string, value: FieldValue) => void;
  onOpenPicker: () => void;
};

/**
 * Field — single field of the booking form (input / textarea / time-slot picker trigger).
 *
 * @param   {FieldProps}                                       props              - Component props.
 * @param   {IFormAttribute}                                   props.attr         - OneEntry form attribute.
 * @param   {Record<string, FieldValue>}                       props.values       - Current form values keyed by marker.
 * @param   {(marker: string, value: FieldValue) => void}      props.onChange     - Setter that updates a single field.
 * @param   {() => void}                                       props.onOpenPicker - Opens the date/time picker (for `timeInterval`/`time_slot`).
 * @returns JSX of the field.
 */
const Field = ({ attr, values, onChange, onOpenPicker }: FieldProps): JSX.Element => {
  const label = attr.localizeInfos?.title ?? attr.marker;
  const isUppercase = attr.marker === 'name' || attr.marker === 'surname';

  if (attr.type === 'timeInterval' || attr.marker === 'time_slot') {
    const v = values[attr.marker];
    return (
      <button
        type="button"
        onClick={() => onOpenPicker()}
        className="flex flex-1 flex-col border-b border-b-muted text-left"
      >
        <span className="font-normal text-base text-paper">{label}</span>
        <span className="cart_input block">{v || 'Select date & time'}</span>
      </button>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col border-b border-b-muted">
        <label htmlFor={attr.marker} className="font-normal text-base text-paper">
          {label}
        </label>
        <textarea
          id={attr.marker}
          name={attr.marker}
          value={values[attr.marker] ?? ''}
          onChange={ev => onChange(attr.marker, ev.currentTarget.value)}
          className="cart_input resize-none w-full"
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col border-b border-b-muted">
      <label htmlFor={attr.marker} className="font-normal text-base text-paper">
        {label}
      </label>
      <input
        id={attr.marker}
        name={attr.marker}
        type={resolveInputType(attr.type as string, attr.marker)}
        value={values[attr.marker] ?? ''}
        onChange={ev => onChange(attr.marker, ev.currentTarget.value)}
        className={'cart_input' + (isUppercase ? ' uppercase' : '')}
      />
    </div>
  );
};

export default ReservationForm;
