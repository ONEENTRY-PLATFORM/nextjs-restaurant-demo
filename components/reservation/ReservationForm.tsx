'use client';

import type { IFormAttribute, IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi, isError } from '@/app/api';
import { validators } from '@/app/api/utils/validators';
import { useEnterpriseCaptcha } from '@/app/hooks/useEnterpriseCaptcha';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { toLocalIsoDate } from '@/app/utils/formatDate';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import ReservationAuthStep from './ReservationAuthStep';
import ReservationPaymentStep from './ReservationPaymentStep';
import ReservationSuccess from './ReservationSuccess';
import type { RestaurantOption, ScheduleSlotEntry } from './RestaurantSelect';
import RestaurantSelect from './RestaurantSelect';

type FieldValue = string;

const RESTAURANT_MARKER = 'restaurant';
const TIME_SLOT_MARKER = 'time_slot';
const PREFERENCES_MARKER = 'user_preferences';

/**
 * isFullWidthAttr — attributes that should occupy a full row in the booking form (entity select,
 * multi-line text, date/time picker trigger, and the free-form preferences field rendered as a
 * textarea). Everything else is paired into two-column rows.
 *
 * @param   {IFormAttribute} attr - OneEntry form attribute.
 * @returns `true` when the attribute must render on its own row.
 */
const isFullWidthAttr = (attr: IFormAttribute): boolean =>
  attr.type === 'entity' ||
  attr.type === 'text' ||
  attr.type === 'timeInterval' ||
  attr.marker === TIME_SLOT_MARKER ||
  attr.marker === PREFERENCES_MARKER;

type FormRow =
  | { kind: 'full'; attr: IFormAttribute }
  | { kind: 'pair'; left: IFormAttribute; right?: IFormAttribute };

/** Translator function returned by `useT()` — `(marker, fallback) => string`. */
type Translate = (marker: string, fallback: string) => string;

/**
 * validateField — runs the OneEntry validators attached to a single attribute against the current
 * value and returns a localized error message, or `null` when the value passes every check.
 *
 * @param   {IFormAttribute} attr  - OneEntry form attribute carrying the `validators` map.
 * @param   {string}         value - Current field value (always a string in this form).
 * @param   {Translate}      t     - Dictionary lookup for the error message.
 * @returns Error string to display, or `null` when valid.
 */
const validateField = (attr: IFormAttribute, value: string, t: Translate): string | null => {
  const v = (attr.validators ?? {}) as Record<string, unknown>;
  const required = (v.requiredValidator as { strict?: boolean } | undefined)?.strict === true;

  if (required && !validators.requiredValidator(value)) {
    return t('validation_required', 'Required field');
  }
  if (!value.length) return null;

  const strCfg = v.stringInspectionValidator as
    | { stringMin?: number; stringMax?: number; stringLength?: number }
    | undefined;
  if (strCfg && (strCfg.stringMin || strCfg.stringMax || strCfg.stringLength)) {
    if (!validators.stringInspectionValidator(value, strCfg)) {
      const { stringMin, stringMax, stringLength } = strCfg;
      if (stringLength && stringLength > 0) {
        return t('validation_string_length', `Length must be exactly ${stringLength}`);
      }
      return t(
        'validation_string_range',
        `Length must be between ${stringMin ?? 0} and ${stringMax ?? 0}`
      );
    }
  }

  if (v.emailInspectionValidator === true && !validators.emailInspectionValidator(value)) {
    return t('validation_email', 'Invalid email');
  }

  const mask = v.fieldMaskValidator as { maskValue?: string } | undefined;
  if (mask?.maskValue && !validators.fieldMaskValidator(value, mask)) {
    return t('validation_mask', 'Invalid format');
  }

  return null;
};

/**
 * buildFormRows — walks the position-sorted attributes and groups them into form rows: full-width
 * fields get their own row; narrow fields are paired sequentially into two-column rows. Skips
 * `button` and `spam` (the latter is submitted invisibly).
 *
 * @param   {IFormAttribute[]} sortedAttrs - Attributes pre-sorted by `position`.
 * @returns Rows ready to render in document order.
 */
const buildFormRows = (sortedAttrs: IFormAttribute[]): FormRow[] => {
  const rows: FormRow[] = [];
  let pending: IFormAttribute | null = null;
  for (const attr of sortedAttrs) {
    if (attr.type === 'button' || attr.type === 'spam') continue;
    if (isFullWidthAttr(attr)) {
      if (pending) {
        rows.push({ kind: 'pair', left: pending });
        pending = null;
      }
      rows.push({ kind: 'full', attr });
    } else if (pending) {
      rows.push({ kind: 'pair', left: pending, right: attr });
      pending = null;
    } else {
      pending = attr;
    }
  }
  if (pending) rows.push({ kind: 'pair', left: pending });
  return rows;
};

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

export type AuthSubStep =
  | 'providers'
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'verification-otp'
  | 'verification-activate'
  | 'reset-password';

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

  const todayIso = toLocalIsoDate();

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-5 px-5 md:px-0" noValidate>
      {rows.map((row, i) => {
        if (row.kind === 'full') {
          const { attr } = row;
          if (attr.type === 'entity') {
            if (attr.marker !== RESTAURANT_MARKER || restaurants.length === 0) return null;
            return (
              <div key={attr.marker} className="flex flex-col gap-1">
                <RestaurantSelect
                  options={restaurants}
                  value={values[RESTAURANT_MARKER] ?? ''}
                  onChange={v => onChange(RESTAURANT_MARKER, v)}
                  placeholder={String(attr.additionalFields?.placeholder?.value ?? '')}
                />
                {errors[attr.marker] ? (
                  <span className="px-4 text-sm text-red-500">{errors[attr.marker]}</span>
                ) : null}
              </div>
            );
          }
          return (
            <Field
              key={attr.marker}
              attr={attr}
              values={values}
              onChange={onChange}
              onOpenPicker={() => setPickerOpen(true)}
              error={errors[attr.marker] ?? null}
            />
          );
        }
        return (
          <div key={`row-${i}`} className="flex justify-between gap-3.75">
            <Field
              attr={row.left}
              values={values}
              onChange={onChange}
              onOpenPicker={() => setPickerOpen(true)}
              error={errors[row.left.marker] ?? null}
            />
            {row.right ? (
              <Field
                attr={row.right}
                values={values}
                onChange={onChange}
                onOpenPicker={() => setPickerOpen(true)}
                error={errors[row.right.marker] ?? null}
              />
            ) : (
              <div className="flex-1" />
            )}
          </div>
        );
      })}

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
  error: string | null;
};

/**
 * Field — single field of the booking form (input / textarea / time-slot picker trigger).
 *
 * @param   {FieldProps}                                       props              - Component props.
 * @param   {IFormAttribute}                                   props.attr         - OneEntry form attribute.
 * @param   {Record<string, FieldValue>}                       props.values       - Current form values keyed by marker.
 * @param   {(marker: string, value: FieldValue) => void}      props.onChange     - Setter that updates a single field.
 * @param   {() => void}                                       props.onOpenPicker - Opens the date/time picker (for `timeInterval`/`time_slot`).
 * @param   {string | null}                                    props.error        - Validation error to render under the field, or `null` when valid.
 * @returns JSX of the field.
 */
const Field = ({ attr, values, onChange, onOpenPicker, error }: FieldProps): JSX.Element => {
  const label = attr.localizeInfos?.title ?? attr.marker;
  const isUppercase = attr.marker === 'name' || attr.marker === 'surname';
  const borderClass = error ? 'border-b-red-500' : 'border-b-muted';
  const errorNode = error ? <span className="mt-1 text-sm text-red-500">{error}</span> : null;

  if (attr.type === 'timeInterval' || attr.marker === 'time_slot') {
    const v = values[attr.marker];
    return (
      <div className="flex flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenPicker()}
          className={`flex flex-col border-b text-left ${borderClass}`}
        >
          <span className="font-normal text-base text-paper">{label}</span>
          <span className="cart_input block">{v || 'Select date & time'}</span>
        </button>
        {errorNode}
      </div>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col">
        <div className={`flex flex-col border-b ${borderClass}`}>
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
        {errorNode}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className={`flex flex-col border-b ${borderClass}`}>
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
      {errorNode}
    </div>
  );
};

export default ReservationForm;
