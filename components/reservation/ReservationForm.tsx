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
 * Конвертирует выбранный пользователем слот (`yyyy-MM-dd HH.MM`) в формат
 * `timeInterval`, которого ждёт OneEntry: `[[startISO, endISO]]`.
 *
 * Конец слота ищется в расписании ресторана (атрибут `schedule` типа
 * `timeInterval`): среди применимых записей берём первую с совпадающим
 * `from`. Если ничего не подошло (расписание пусто или есть рассинхрон) —
 * fallback на +1 час относительно стартового времени.
 * @param   {string}             raw           - Значение поля `time_slot`.
 * @param   {string | undefined} restaurantValue - Текущее значение `restaurant`.
 * @param   {RestaurantOption[]} restaurants   - Доступные опции ресторанов.
 * @returns {Array<[string, string]>}         Интервалы для отправки.
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
 * Маппит тип атрибута OneEntry формы + маркер в нативный HTML input `type`.
 * @param   {string} type   - `type` атрибута OneEntry.
 * @param   {string} marker - Маркер атрибута, используется для эвристики.
 * @returns {string}        HTML input type.
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
  // Предзаполнение полей по маркеру. Используется в попап-режиме —
  // при открытии BOOK A TABLE со страницы конкретного ресторана
  // сюда приходит `{ restaurant: '<handle>' }`, чтобы дропдаун уже
  // показывал выбранный ресторан.
  initialValues?: Record<string, FieldValue> | undefined;
  // Если задано — форма работает в режиме редактирования существующей
  // брони: вместо `Orders.createOrder` используется
  // `Orders.updateOrderByMarkerAndId`, шаги auth/payment скипаются
  // (юзер уже авторизован и payment-method выбран на оригинальном заказе).
  // Заполняется из {@link consumePendingReservationEdit} в ReservationPopup.
  editingOrder?:
    | {
        orderId: number;
        paymentAccountIdentifier: string;
        formIdentifier: string;
      }
    | null
    | undefined;
  // Колбэк закрытия попапа после успешного update — вызывает
  // {@link OpenDrawerContext}.setOpen(false) в обёртке.
  onClose?: () => void;
};

/**
 * Форма бронирования — повторяет вёрстку `service_table.html` из static-html:
 * дропдаун ресторана, двухколоночная сетка для name/surname/phone/guests/date/time,
 * textarea для предпочтений, основная кнопка отправки.
 *
 * Поля даты и времени открывают объединённый полноэкранный bottom-sheet
 * пикер {@link DateTimePickerSheet} вместо нативного `<input type="date">` —
 * это соответствует мокапам `service_date.html` и `service_time.html`,
 * слитым в одну форму.
 * @param   {ReservationFormProps} props - Пропсы компонента.
 * @returns {JSX.Element}                JSX формы бронирования.
 */
/**
 * Состояние мульти-шагового флоу бронирования:
 *   - `form`    — booking-form (Figma `service_table`)
 *   - `payment` — выбор способа оплаты + плейсхолдер карточной формы
 *                 (Figma `120:1875`); хранит подготовленные `formData`,
 *                 чтобы не пересобирать payload по нажатию Apply.
 *   - `success` — экран подтверждения (Figma `120:2338`); хранит id
 *                 заказа и текстовую сводку для нижнего блока.
 */
type ReservationStep =
  | { kind: 'form' }
  | { kind: 'auth'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'payment'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'success'; orderId: number; summary: string };

/**
 * Форматирует сводку бронирования по Figma `120:2338`:
 * `DD.MM.YY HH.MM N person`. Источник — текущие значения формы.
 * @param   {Record<string, string>} values - Значения полей формы.
 * @returns {string}                        Сводка для success-экрана.
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

const ReservationForm = ({
  form,
  restaurants = [],
  initialValues,
  editingOrder,
  onClose,
}: ReservationFormProps): JSX.Element => {
  const t = useT();
  const { isAuth } = useContext(AuthContext);
  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<ReservationStep>({ kind: 'form' });
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
            // OneEntry ожидает объект `{ event: { token, siteKey } }` —
            // см. useEnterpriseCaptcha.
            value: captcha,
          } as unknown as IOrdersFormData;
        }
        const raw = values[attr.marker] ?? '';
        if (attr.type === 'text') {
          // OneEntry: «Only one of htmlValue, plainValue or mdValue can be provided».
          return {
            marker: attr.marker,
            type: 'text',
            value: [{ plainValue: raw }],
          };
        }
        if (attr.type === 'entity') {
          // У entity-атрибута формы нет listTitles — варианты выбора
          // источаются динамически (для `restaurant` — из дочерних
          // страниц `restaurants`). OneEntry ожидает массив числовых
          // id: `value: [<pageId>]`.
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
          // Значение хранится как `"yyyy-MM-dd HH.MM"` (см. DateTimePickerSheet
          // и getAvailableSlotsForDate). OneEntry ждёт `[[startISO, endISO]]` —
          // конец слота берём из расписания выбранного ресторана; если не
          // совпало — fallback на +1 час.
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

  // Шаг 1: валидируем форму, собираем payload и:
  //   - в режиме создания брони → переключаем попап на экран выбора
  //     оплаты (или auth, если юзер не залогинен — `Orders.createOrder`
  //     требует user-token).
  //   - в режиме редактирования (editingOrder задан) → сразу вызываем
  //     `Orders.updateOrderByMarkerAndId` без auth/payment-шагов: юзер
  //     уже авторизован, payment-method взят с оригинального заказа.
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

  // Шаг 2: пользователь выбрал способ оплаты. Создаём order, для
  // online-методов открываем Stripe-сессию и редиректим на её
  // `paymentUrl`; для офлайна показываем success-экран в попапе
  // (Figma 120:2338).
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

      // Online → открываем платёжную сессию и редиректим. Стрипа
      // достаточно — Cash-аккаунты вернут paymentUrl=null и попадут в
      // ветку показа success в попапе.
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
          // глушим — заказ уже создан, на success всё равно перейдём
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
        onAuthSuccess={() => {
          setError('');
          setStep({ kind: 'payment', formData: step.formData, summary: step.summary });
        }}
        onBack={() => {
          setError('');
          setStep({ kind: 'form' });
        }}
      />
    );
  }

  if (step.kind === 'payment') {
    return (
      <ReservationPaymentStep
        onApply={onApplyPayment}
        isLoading={loading}
        error={error}
        onBack={() => {
          setError('');
          setStep({ kind: 'form' });
        }}
      />
    );
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

      {/* Textarea предпочтений (полная ширина) */}
      {hasNotes ? (
        <div className="flex flex-col border-b border-b-muted">
          <label htmlFor={TEXT_MARKER} className="font-normal text-[16px] text-paper">
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

      {/* Все оставшиеся поля, не размещённые в сетке выше (fallback) */}
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

      {/* Капча — invisible reCAPTCHA Enterprise, грузится через
          useEnterpriseCaptcha; в DOM ничего не рендерим. */}

      {/* Основная кнопка отправки */}
      <div className="mt-7.5 flex flex-col items-center justify-center gap-5">
        <button
          type="submit"
          disabled={loading}
          className="flex h-9.25 w-31.25 items-center justify-center rounded-[5px] bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-[10px] hover_btn_transp disabled:opacity-60"
        >
          {t('continue_text', 'Continue')}
        </button>
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      {/* Объединённый попап выбора даты и времени. Слоты времени берутся из
          `restaurant.schedule` (атрибут OneEntry типа `timeInterval`) — после
          выбора даты ниже календаря показываются доступные слоты. */}
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
 * Одиночное поле input/textarea, рендерящееся для атрибута формы. Стилизовано
 * по `service_table.html`: нижний бордер, прозрачный фон, uppercase для имени.
 *
 * Для маркеров `reservation_date` и `reservation_time` рендерит кнопку,
 * которая открывает соответствующий slide-up пикер вместо нативного input.
 * @param   {FieldProps}  props - Пропсы поля.
 * @returns {JSX.Element}       JSX поля.
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
        <span className="font-normal text-[16px] text-paper">{label}</span>
        <span className="cart_input block">{v || 'Select date & time'}</span>
      </button>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col border-b border-b-muted">
        <label htmlFor={attr.marker} className="font-normal text-[16px] text-paper">
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
      <label htmlFor={attr.marker} className="font-normal text-[16px] text-paper">
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
