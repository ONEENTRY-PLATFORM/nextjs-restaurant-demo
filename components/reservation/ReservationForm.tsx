'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type {
  IFormAttribute,
  IFormsEntity,
} from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useMemo, useState } from 'react';

import type { ReservationPayload } from '@/app/actions/reservation';
import { submitReservation } from '@/app/actions/reservation';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import TimePickerSheet from '@/components/ui/TimePickerSheet';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import FormCaptcha from '../forms/inputs/FormCaptcha';
import type { RestaurantOption } from './RestaurantSelect';
import RestaurantSelect from './RestaurantSelect';

type FieldValue = string;
type PickerMode = 'date' | 'time' | null;

/**
 * Fields rendered in the 2-column rows (per `service_table.html` layout).
 * @private
 */
const ROW_PAIRS: Array<[string, string]> = [
  ['reservation_name', 'reservation_surname'],
  ['reservation_phone', 'guests_count'],
  ['reservation_date', 'reservation_time'],
];

const TEXT_MARKER = 'reservation_notes';
const RESTAURANT_MARKER = 'reservation_restaurant';
const DATE_MARKER = 'reservation_date';
const TIME_MARKER = 'reservation_time';

/**
 * Map OneEntry form attribute type + marker to native HTML input `type`.
 * @param   {string} type   - OneEntry attribute `type`.
 * @param   {string} marker - Attribute marker, used for heuristic.
 * @returns {string}        HTML input type.
 */
const resolveInputType = (type: string, marker: string): string => {
  if (type === 'integer' || type === 'real' || type === 'float')
    return 'number';
  if (marker.includes('email')) return 'email';
  if (marker.includes('phone') || marker.includes('tel')) return 'tel';
  if (marker.includes('password')) return 'password';
  return 'text';
};

type ReservationFormProps = {
  form: IFormsEntity;
  dict?: IAttributeValues;
  restaurants?: RestaurantOption[];
};

/**
 * Reservation form — replicates the static-html `service_table.html` layout:
 * restaurant dropdown, two-column grid for name/surname/phone/guests/date/time,
 * textarea for preferences, primary submit.
 *
 * Date and time fields open fullscreen bottom-sheet pickers
 * ({@link DatePickerSheet} and {@link TimePickerSheet}) instead of native
 * `<input type="date">` — this matches `service_date.html` and
 * `service_time.html` mockups.
 * @param   {ReservationFormProps} props - Component props.
 * @returns {JSX.Element}                Reservation form JSX.
 */
const ReservationForm = ({
  form,
  dict,
  restaurants = [],
}: ReservationFormProps): JSX.Element => {
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [picker, setPicker] = useState<PickerMode>(null);

  const attrs = useMemo<IFormAttribute[]>(
    () =>
      form?.attributes
        ? [...form.attributes].sort((a, b) => a.position - b.position)
        : [],
    [form],
  );

  const attrByMarker = useMemo(() => {
    const map = new Map<string, IFormAttribute>();
    for (const a of attrs) map.set(a.marker, a);
    return map;
  }, [attrs]);

  const hasSpam = useMemo(() => attrs.some((a) => a.type === 'spam'), [attrs]);
  const spamAttr = useMemo(() => attrs.find((a) => a.type === 'spam'), [attrs]);

  const onChange = (marker: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [marker]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasSpam && !captchaToken) {
      setError('Please complete the captcha.');
      return;
    }
    setLoading(true);
    setError('');

    const payloadFormData: ReservationPayload['formData'] = attrs
      .filter((attr) => attr.type !== 'spam' && attr.type !== 'button')
      .map((attr) => {
        const raw = values[attr.marker] ?? '';
        if (attr.type === 'text') {
          return {
            marker: attr.marker,
            type: 'text',
            value: [{ htmlValue: raw, plainValue: raw }],
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
        return {
          marker: attr.marker,
          type: attr.type === 'integer' ? 'integer' : 'string',
          value: raw,
        };
      });

    const res = await submitReservation({ formData: payloadFormData });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setValues({});
    } else {
      setError(res.message);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-107.5 rounded-xl bg-ink/60 p-6 text-center">
        <h3 className="mb-2 font-bold text-[20px] uppercase text-brand">
          {(dict?.reservation_success_title?.value as string) ??
            'Table reserved!'}
        </h3>
        <p className="text-paper/90">
          {(dict?.reservation_success_text?.value as string) ??
            'We will contact you shortly to confirm.'}
        </p>
      </div>
    );
  }

  const hasNotes = attrByMarker.has(TEXT_MARKER);
  const hasRestaurant =
    attrByMarker.has(RESTAURANT_MARKER) && restaurants.length > 0;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-[393px] flex-col gap-[20px] px-[20px] md:max-w-107.5 md:px-0"
    >
      {hasRestaurant ? (
        <RestaurantSelect
          options={restaurants}
          value={values[RESTAURANT_MARKER] ?? ''}
          onChange={(v) => onChange(RESTAURANT_MARKER, v)}
          placeholder="Restaurant choosing"
        />
      ) : null}

      {/* 2-column rows */}
      {ROW_PAIRS.map(([left, right]) => {
        const leftAttr = attrByMarker.get(left);
        const rightAttr = attrByMarker.get(right);
        if (!leftAttr && !rightAttr) return null;
        return (
          <div key={left + right} className="flex justify-between gap-[15px]">
            {leftAttr ? (
              <Field
                attr={leftAttr}
                values={values}
                onChange={onChange}
                onOpenPicker={setPicker}
              />
            ) : (
              <div />
            )}
            {rightAttr ? (
              <Field
                attr={rightAttr}
                values={values}
                onChange={onChange}
                onOpenPicker={setPicker}
              />
            ) : (
              <div />
            )}
          </div>
        );
      })}

      {/* Preferences textarea (full width) */}
      {hasNotes ? (
        <div className="flex flex-col border-b border-b-[#b0bcce]">
          <label
            htmlFor={TEXT_MARKER}
            className="font-normal text-[16px] text-[#dfe9f9]"
          >
            {attrByMarker.get(TEXT_MARKER)?.localizeInfos?.title ??
              'Preferences'}
          </label>
          <textarea
            id={TEXT_MARKER}
            name={TEXT_MARKER}
            value={values[TEXT_MARKER] ?? ''}
            onChange={(ev) => onChange(TEXT_MARKER, ev.currentTarget.value)}
            className="cart_input resize-none w-full"
            rows={4}
          />
        </div>
      ) : null}

      {/* Any remaining fields not placed in the grid above (fallback) */}
      {attrs
        .filter(
          (a) =>
            a.type !== 'spam' &&
            a.type !== 'button' &&
            a.marker !== TEXT_MARKER &&
            a.marker !== RESTAURANT_MARKER &&
            !ROW_PAIRS.flat().includes(a.marker),
        )
        .map((a) => (
          <Field
            key={a.marker}
            attr={a}
            values={values}
            onChange={onChange}
            onOpenPicker={setPicker}
          />
        ))}

      {/* Captcha */}
      {spamAttr ? (
        <FormCaptcha
          setToken={setCaptchaToken}
          setIsCaptcha={() => {}}
          captchaKey={
            (spamAttr.settings as { captchaKey?: string } | undefined)
              ?.captchaKey || ''
          }
        />
      ) : null}

      {/* Primary submit */}
      <div className="mt-[30px] flex flex-col items-center justify-center gap-5">
        <button
          type="submit"
          disabled={loading}
          className="flex h-[37px] w-[125px] items-center justify-center rounded-[5px] bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-[10px] hover_btn_transp disabled:opacity-60"
        >
          {loading
            ? '...'
            : ((dict?.reservation_submit_text?.value as string) ?? 'Book')}
        </button>
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      {/* Slide-up pickers */}
      {picker === 'date' ? (
        <DatePickerSheet
          value={values[DATE_MARKER] || todayIso}
          minDate={todayIso}
          onApply={(iso) => {
            onChange(DATE_MARKER, iso);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {picker === 'time' ? (
        <TimePickerSheet
          value={values[TIME_MARKER] ?? ''}
          onApply={(t) => {
            onChange(TIME_MARKER, t);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </form>
  );
};

type FieldProps = {
  attr: IFormAttribute;
  values: Record<string, FieldValue>;
  onChange: (marker: string, value: FieldValue) => void;
  onOpenPicker: (mode: PickerMode) => void;
};

/**
 * Single input/textarea field rendered for a form attribute. Styled per
 * `service_table.html`: bottom border, transparent bg, uppercase for name.
 *
 * For `reservation_date` and `reservation_time` markers renders a button
 * that opens the corresponding slide-up picker instead of a native input.
 * @param   {FieldProps}  props - Field props.
 * @returns {JSX.Element}       Field JSX.
 */
const Field = ({
  attr,
  values,
  onChange,
  onOpenPicker,
}: FieldProps): JSX.Element => {
  const label = attr.localizeInfos?.title ?? attr.marker;
  const isUppercase =
    attr.marker === 'reservation_name' || attr.marker === 'reservation_surname';

  if (attr.marker === DATE_MARKER) {
    const v = values[DATE_MARKER];
    return (
      <button
        type="button"
        onClick={() => onOpenPicker('date')}
        className="flex flex-1 flex-col border-b border-b-[#b0bcce] text-left"
      >
        <span className="font-normal text-[16px] text-[#dfe9f9]">{label}</span>
        <span className="cart_input block">{v || 'Select date'}</span>
      </button>
    );
  }

  if (attr.marker === TIME_MARKER) {
    const v = values[TIME_MARKER];
    return (
      <button
        type="button"
        onClick={() => onOpenPicker('time')}
        className="flex flex-1 flex-col border-b border-b-[#b0bcce] text-left"
      >
        <span className="font-normal text-[16px] text-[#dfe9f9]">{label}</span>
        <span className="cart_input block">{v || 'Select time'}</span>
      </button>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col border-b border-b-[#b0bcce]">
        <label
          htmlFor={attr.marker}
          className="font-normal text-[16px] text-[#dfe9f9]"
        >
          {label}
        </label>
        <textarea
          id={attr.marker}
          name={attr.marker}
          value={values[attr.marker] ?? ''}
          onChange={(ev) => onChange(attr.marker, ev.currentTarget.value)}
          className="cart_input resize-none w-full"
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col border-b border-b-[#b0bcce]">
      <label
        htmlFor={attr.marker}
        className="font-normal text-[16px] text-[#dfe9f9]"
      >
        {label}
      </label>
      <input
        id={attr.marker}
        name={attr.marker}
        type={resolveInputType(attr.type as string, attr.marker)}
        value={values[attr.marker] ?? ''}
        onChange={(ev) => onChange(attr.marker, ev.currentTarget.value)}
        className={'cart_input' + (isUppercase ? ' uppercase' : '')}
      />
    </div>
  );
};

export default ReservationForm;
