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
import { useEnterpriseCaptcha } from '@/app/hooks/useEnterpriseCaptcha';
import DatePickerSheet from '@/components/ui/DatePickerSheet';
import TimePickerSheet from '@/components/ui/TimePickerSheet';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import type {
  RestaurantOption,
  ScheduleSlotEntry,
} from './RestaurantSelect';
import RestaurantSelect from './RestaurantSelect';

type FieldValue = string;
type PickerMode = 'date' | 'time' | null;

/**
 * Поля, рендерящиеся в 2-колоночных строках (согласно вёрстке `service_table.html`).
 * Маркеры соответствуют админской форме `booking_order`.
 * @private
 */
const ROW_PAIRS: Array<[string, string]> = [
  ['name', 'surname'],
  ['phone', 'people_count'],
];

const TEXT_MARKER = 'user_preferences';
const RESTAURANT_MARKER = 'restaurant';
const TIME_SLOT_MARKER = 'time_slot';

/**
 * Возвращает массив доступных стартов слотов в формате `HH.MM` для
 * указанной даты (`yyyy-MM-dd`) на основе расписания ресторана из
 * OneEntry (`attribute schedule`, тип `timeInterval`).
 *
 * Алгоритм:
 *  1) Перебираем записи расписания.
 *  2) Запись применима, если `inEveryWeek === true` (каждую неделю), либо
 *     если выбранная дата попадает в диапазон `[dates[0], dates[1]]`.
 *  3) Из `times` берём `[from]` каждого слота — это и есть стартовое
 *     время, форматируем как `HH.MM` (точка — соответствует
 *     static-html стилю `service_time` "10.00").
 *  4) Дедуплицируем и сортируем.
 *
 * Если расписание пустое или ничего не подходит — вернём `[]`, тогда
 * TimePicker покажет «No available slots».
 * @param   {ScheduleSlotEntry[]} schedule - Сырые записи из `schedule.value`.
 * @param   {string}              dateIso  - Выбранная дата `yyyy-MM-dd`.
 * @returns {string[]}                     Список меток слотов.
 */
const getAvailableSlotsForDate = (
  schedule: ScheduleSlotEntry[] | undefined,
  dateIso: string,
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
 * Маппит тип атрибута OneEntry формы + маркер в нативный HTML input `type`.
 * @param   {string} type   - `type` атрибута OneEntry.
 * @param   {string} marker - Маркер атрибута, используется для эвристики.
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
  dict?: IAttributeValues | undefined;
  restaurants?: RestaurantOption[] | undefined;
  // Предзаполнение полей по маркеру. Используется в попап-режиме —
  // при открытии BOOK A TABLE со страницы конкретного ресторана
  // сюда приходит `{ restaurant: '<handle>' }`, чтобы дропдаун уже
  // показывал выбранный ресторан.
  initialValues?: Record<string, FieldValue> | undefined;
};

/**
 * Форма бронирования — повторяет вёрстку `service_table.html` из static-html:
 * дропдаун ресторана, двухколоночная сетка для name/surname/phone/guests/date/time,
 * textarea для предпочтений, основная кнопка отправки.
 *
 * Поля даты и времени открывают полноэкранные bottom-sheet пикеры
 * ({@link DatePickerSheet} и {@link TimePickerSheet}) вместо нативного
 * `<input type="date">` — это соответствует мокапам `service_date.html` и
 * `service_time.html`.
 * @param   {ReservationFormProps} props - Пропсы компонента.
 * @returns {JSX.Element}                JSX формы бронирования.
 */
const ReservationForm = ({
  form,
  dict,
  restaurants = [],
  initialValues,
}: ReservationFormProps): JSX.Element => {
  const [values, setValues] = useState<Record<string, FieldValue>>(
    initialValues ?? {},
  );
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

  const spamAttr = useMemo(() => attrs.find((a) => a.type === 'spam'), [attrs]);
  const spamSettings = spamAttr?.settings as
    | { captcha?: { key?: string; action?: string } }
    | undefined;
  const captcha = useEnterpriseCaptcha(
    spamSettings?.captcha?.key,
    spamSettings?.captcha?.action,
  );

  const onChange = (marker: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [marker]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (spamAttr && !captcha) {
      setError('Please wait while captcha is loading.');
      return;
    }
    setLoading(true);
    setError('');

    const payloadFormData: ReservationPayload['formData'] = attrs
      .filter((attr) => attr.type !== 'button')
      .map((attr) => {
        if (attr.type === 'spam') {
          return {
            marker: attr.marker,
            type: 'spam',
            // OneEntry ожидает объект `{ event: { token, siteKey } }` —
            // см. useEnterpriseCaptcha. Тип FormDataType не покрывает spam,
            // отсюда `as unknown` для narrowing'а.
            value: captcha,
          } as unknown as ReservationPayload['formData'][number];
        }
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
          {(dict?.info_text?.value as string) ?? 'Table reserved!'}
        </h3>
        <p className="text-paper/90">
          {(dict?.reservation_confirmed?.value as string) ??
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
      className="flex w-full flex-col gap-5 px-5 md:px-0"
    >
      {hasRestaurant ? (
        <RestaurantSelect
          options={restaurants}
          value={values[RESTAURANT_MARKER] ?? ''}
          onChange={(v) => onChange(RESTAURANT_MARKER, v)}
          placeholder="Restaurant choosing"
        />
      ) : null}

      {/* 2-колоночные строки */}
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

      {/* Textarea предпочтений (полная ширина) */}
      {hasNotes ? (
        <div className="flex flex-col border-b border-b-muted">
          <label
            htmlFor={TEXT_MARKER}
            className="font-normal text-[16px] text-paper"
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

      {/* Все оставшиеся поля, не размещённые в сетке выше (fallback) */}
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

      {/* Капча — invisible reCAPTCHA Enterprise, грузится через
          useEnterpriseCaptcha; в DOM ничего не рендерим. */}

      {/* Основная кнопка отправки */}
      <div className="mt-7.5 flex flex-col items-center justify-center gap-5">
        <button
          type="submit"
          disabled={loading}
          className="flex h-9.25 w-31.25 items-center justify-center rounded-[5px] bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-[10px] hover_btn_transp disabled:opacity-60"
        >
          {loading ? '...' : ((dict?.submit_text?.value as string) ?? 'Book')}
        </button>
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      {/* Slide-up пикеры — сначала дата, потом время, оба пишут в TIME_SLOT_MARKER */}
      {picker === 'date' ? (
        <DatePickerSheet
          value={values[TIME_SLOT_MARKER]?.split(' ')?.[0] || todayIso}
          minDate={todayIso}
          onApply={(iso) => {
            onChange(TIME_SLOT_MARKER, iso);
            setPicker('time');
          }}
          onClose={() => setPicker(null)}
          // Для date-пикера back == close: предыдущего шага нет.
          onBack={() => setPicker(null)}
          applyText={dict?.apply_text?.value as string | undefined}
        />
      ) : null}
      {picker === 'time' ? (
        <TimePickerSheet
          value={values[TIME_SLOT_MARKER]?.split(' ')?.[1] ?? ''}
          slots={getAvailableSlotsForDate(
            restaurants.find(
              (r) => r.value === (values[RESTAURANT_MARKER] ?? ''),
            )?.schedule,
            values[TIME_SLOT_MARKER]?.split(' ')?.[0] ?? todayIso,
          )}
          onApply={(t) => {
            const d = values[TIME_SLOT_MARKER]?.split(' ')?.[0] ?? todayIso;
            onChange(TIME_SLOT_MARKER, `${d} ${t}`);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
          // Back возвращает к date-пикеру, как в reservation-flow:
          // user сначала выбирает дату, потом время.
          onBack={() => setPicker('date')}
          applyText={dict?.apply_text?.value as string | undefined}
          noTimeText={dict?.no_time_text?.value as string | undefined}
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
 * Одиночное поле input/textarea, рендерящееся для атрибута формы. Стилизовано
 * по `service_table.html`: нижний бордер, прозрачный фон, uppercase для имени.
 *
 * Для маркеров `reservation_date` и `reservation_time` рендерит кнопку,
 * которая открывает соответствующий slide-up пикер вместо нативного input.
 * @param   {FieldProps}  props - Пропсы поля.
 * @returns {JSX.Element}       JSX поля.
 */
const Field = ({
  attr,
  values,
  onChange,
  onOpenPicker,
}: FieldProps): JSX.Element => {
  const label = attr.localizeInfos?.title ?? attr.marker;
  const isUppercase = attr.marker === 'name' || attr.marker === 'surname';

  if (attr.type === 'timeInterval' || attr.marker === 'time_slot') {
    const v = values[attr.marker];
    return (
      <button
        type="button"
        onClick={() => onOpenPicker('date')}
        className="flex flex-1 flex-col border-b border-b-muted text-left"
      >
        <span className="font-normal text-[16px] text-paper">{label}</span>
        <span className="cart_input block">{v || 'Select date & time'}</span>
      </button>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col border-b border-b-muted">
        <label
          htmlFor={attr.marker}
          className="font-normal text-[16px] text-paper"
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
    <div className="flex flex-1 flex-col border-b border-b-muted">
      <label
        htmlFor={attr.marker}
        className="font-normal text-[16px] text-paper"
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
