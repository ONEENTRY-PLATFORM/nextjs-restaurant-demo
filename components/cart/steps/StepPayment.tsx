'use client';

import Image from 'next/image';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';

import { useCreateOrder, useGetAccountsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { selectDeliveryData, setDeliveryData } from '@/app/store/reducers/CartSlice';
import { addData, addPaymentMethod, setStep, setStepError } from '@/app/store/reducers/OrderSlice';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';
import ClockCircleIcon from '@/components/icons/clock-circle';
import PencilIcon from '@/components/icons/pencil';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

import { formatAddressLine, parseSavedAddresses, pickSelectedAddress } from './savedAddress';

const ADDRESS_MARKERS = ['address_reg', 'address', 'delivery_address'] as const;
const PHONE_MARKERS = ['phone', 'phone_reg', 'contact_phone'] as const;

const formatScheduleAt = (dateIso: string, time: string): string => {
  const [yyyy, mm, dd] = dateIso.split('-');
  if (!yyyy || !mm || !dd || !time) return '';
  return `${dd}.${mm}.${yyyy.slice(2)} ${time}`;
};

const parseScheduleAt = (raw: string): { date: string; time: string } => {
  const m = raw.match(/^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}\.\d{2})$/);
  if (!m) return { date: '', time: '' };
  const [, dd, mm, yy, time] = m;
  return { date: `20${yy}-${mm}-${dd}`, time: time! };
};

const ASAP_INTERVAL_MIN = 45;

/**
 * Собирает значение для атрибута `delivery_time` (тип `timeInterval`):
 * массив пар `[[startISO, endISO]]`, как требует OneEntry SDK.
 * - asap: start=now, end=now+45 мин.
 * - scheduled (`DD.MM.YY HH.MM`): start=parsed, end=start+1 ч.
 * Возвращает null, если scheduled-значение не парсится — тогда поле не
 * шлём в заказ (form-validator пропустит, если поле необязательное).
 */
const buildDeliveryTimeInterval = (
  mode: DeliveryMode,
  scheduledRaw: string
): [[string, string]] | null => {
  if (mode === 'asap') {
    const start = new Date();
    const end = new Date(start.getTime() + ASAP_INTERVAL_MIN * 60 * 1000);
    return [[start.toISOString(), end.toISOString()]];
  }
  const m = scheduledRaw.match(/^(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yy, hh, min] = m;
  const start = new Date(
    Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  );
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return [[start.toISOString(), end.toISOString()]];
};

const findUserField = (
  formData: ReadonlyArray<FormDataType> | undefined,
  markers: readonly string[]
): string => {
  if (!formData) return '';
  for (const marker of markers) {
    const entry = formData.find(el => (el as { marker?: string }).marker === marker) as
      | { value?: unknown }
      | undefined;
    if (typeof entry?.value === 'string' && entry.value) return entry.value;
  }
  return '';
};

type DeliveryMode = 'asap' | 'scheduled';

/**
 * Шаг checkout — адрес + время + оплата на одном экране (cart_PAYMENT.html).
 */
const StepPayment = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { onConfirmOrder, isLoading } = useCreateOrder();
  const { user } = useContext(AuthContext);
  const delivery = useAppSelector(selectDeliveryData);

  // Сначала пробуем структурный `user_address` (street + house + floor),
  // фоллбэк — плоские маркеры (`address_reg` и т.п.). Структурный путь нужен,
  // чтобы в инпуте отображались дом и этаж, а не только улица.
  const savedAddresses = useMemo(() => parseSavedAddresses(user?.formData), [user?.formData]);
  const initialPickedAddress = useMemo(() => pickSelectedAddress(savedAddresses), [savedAddresses]);
  const userAddressFlat = findUserField(user?.formData, ADDRESS_MARKERS);
  const userAddress = formatAddressLine(initialPickedAddress) || userAddressFlat;
  const userPhone = findUserField(user?.formData, PHONE_MARKERS);

  const [address, setAddress] = useState((delivery?.address as string | undefined) || userAddress);
  // Поле `user.formData` приходит асинхронно из AuthContext — на первый
  // рендер часто пустое. Если пользователь не редактировал инпут руками,
  // подтягиваем адрес, как только формдата подгрузилась.
  const [addressTouched, setAddressTouched] = useState<boolean>(
    Boolean(delivery?.address as string | undefined)
  );
  useEffect(() => {
    if (addressTouched) return;
    const next = formatAddressLine(initialPickedAddress) || userAddressFlat;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next) setAddress(next);
  }, [addressTouched, initialPickedAddress, userAddressFlat]);
  const [mode, setMode] = useState<DeliveryMode>('asap');
  const [scheduleAt, setScheduleAt] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data, isLoading: isAccountsLoading } = useGetAccountsQuery({});
  const accounts: IAccountsEntity[] = (data ?? []).filter(a => a.isVisible !== false);

  const [identifier, setIdentifier] = useState('');
  const [comment, setComment] = useState('');
  const [altReceiver, setAltReceiver] = useState(false);
  const [altPhone, setAltPhone] = useState('');

  useEffect(() => {
    if (!identifier && accounts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentifier(accounts[0]!.identifier);
    }
  }, [accounts, identifier]);

  const onNext = async () => {
    if (!identifier || !address.trim()) return;

    const deliveryTime = mode === 'asap' ? '40-45 min' : scheduleAt || '';
    const deliveryInterval = buildDeliveryTimeInterval(mode, scheduleAt);
    dispatch(setDeliveryData({ ...delivery, address, time: deliveryTime }));
    dispatch(addData({ marker: 'delivery_address', type: 'string', value: address }));
    if (userPhone) {
      dispatch(addData({ marker: 'contact_phone', type: 'string', value: userPhone }));
    }
    if (deliveryInterval) {
      dispatch(addData({ marker: 'delivery_time', type: 'timeInterval', value: deliveryInterval }));
    }
    if (comment.trim()) {
      dispatch(addData({ marker: 'comment', type: 'string', value: comment.trim() }));
    }
    if (altReceiver && altPhone.trim()) {
      dispatch(addData({ marker: 'alt_phone', type: 'string', value: altPhone.trim() }));
    }

    dispatch(addPaymentMethod(identifier));
    const result = await onConfirmOrder({ paymentAccountIdentifier: identifier });
    if (!result.ok) {
      dispatch(setStepError(result.error));
      return;
    }
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }
    dispatch(setStep('success'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Address */}
      <div className="flex items-center gap-2.5 text-paper">
        <Image src="/images/icons/pin.svg" alt="" width={17} height={19} />
        <p className="font-normal text-[20px] text-paper">{t('address_text', 'Address')}</p>
      </div>
      <div className="relative flex items-center text-paper">
        <input
          type="text"
          value={address}
          onChange={e => {
            setAddress(e.currentTarget.value);
            setAddressTouched(true);
          }}
          placeholder="OneEntry str."
          className="w-full rounded-[5px] border border-paper bg-transparent p-1.25 text-[16px] text-paper placeholder:text-muted-text focus:placeholder:text-transparent focus:outline-none"
        />
        <PencilIcon className="absolute right-1.75 top-1.75 pointer-events-none" />
      </div>

      {/* Time */}
      <div className="mt-5 flex items-center gap-2.5 text-paper">
        <ClockCircleIcon variant="paper" />
        <p className="font-normal text-[20px] text-paper">{t('time_text', 'Time')}</p>
      </div>
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="time-asap"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'asap'}
          onChange={() => setMode('asap')}
        />
        <label
          htmlFor="time-asap"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">40-45 min</span>
        </label>
      </div>
      <div className="flex items-center gap-2.5 text-paper">
        <input
          type="radio"
          id="time-scheduled"
          name="delivery-time"
          className="hidden peer"
          checked={mode === 'scheduled'}
          onChange={() => setMode('scheduled')}
        />
        <label
          htmlFor="time-scheduled"
          className="radio-custom flex cursor-pointer select-none items-center"
        >
          <span className="ml-2 text-paper">{t('by_the_time', 'by the time')}</span>
        </label>
        <input
          type="text"
          value={scheduleAt}
          readOnly
          onClick={() => {
            setMode('scheduled');
            setPickerOpen(true);
          }}
          placeholder="18.06.24  10.00"
          className="cursor-pointer rounded-[5px] border border-white bg-transparent px-1.25 text-brand opacity-80 focus:outline-none"
        />
      </div>

      {/* Payment */}
      <div className="mt-5 flex items-center gap-2.5">
        <Image src="/images/icons/card-line.svg" alt="" width={23} height={15} />
        <p className="font-normal text-[20px] text-paper">{t('select_payment_text', 'Payment')}</p>
      </div>

      {isAccountsLoading ? (
        <p className="text-paper/70">Loading payment methods…</p>
      ) : accounts.length === 0 ? (
        <p className="text-paper/70">No payment methods are configured. Please contact support.</p>
      ) : (
        accounts.map(account => (
          <PaymentMethodOption
            key={account.id}
            account={account}
            checked={identifier === account.identifier}
            onSelect={() => setIdentifier(account.identifier)}
          />
        ))
      )}

      <input
        type="text"
        value={comment}
        onChange={e => setComment(e.currentTarget.value)}
        placeholder={t('comment_order', 'Comments to the order')}
        className="text-[16px] text-paper placeholder:text-muted-text focus:placeholder:text-transparent border border-paper p-1.25 rounded-[5px] bg-transparent focus:outline-none"
      />

      <label className="custom-checkbox text-[14px] text-paper">
        <input
          type="checkbox"
          checked={altReceiver}
          onChange={e => setAltReceiver(e.currentTarget.checked)}
        />
        <span className="checkbox-box mr-2.5">
          <CheckboxMarkIcon />
        </span>
        {t('another_person_text', 'The order will be taken by another person')}
      </label>

      {altReceiver && (
        <input
          type="tel"
          autoComplete="tel"
          value={altPhone}
          onChange={e => setAltPhone(e.currentTarget.value)}
          placeholder="phone number"
          className="text-[16px] text-paper placeholder:text-muted-text focus:placeholder:text-transparent border border-paper p-1.25 rounded-[5px] bg-transparent focus:outline-none"
        />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading || !identifier || !address.trim() || (altReceiver && !altPhone.trim())}
        className="cart_btn mt-3.75 mx-auto w-60 disabled:opacity-60"
      >
        {isLoading ? 'Processing...' : 'APPLY'}
      </button>

      {pickerOpen ? (
        <DateTimePickerSheet
          date={parseScheduleAt(scheduleAt).date}
          time={parseScheduleAt(scheduleAt).time}
          minDate={todayIso}
          onApply={(d, tm) => {
            setScheduleAt(formatScheduleAt(d, tm));
            setMode('scheduled');
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
          title={t('select_datetime_text', 'Select date and time')}
          dateTitle={t('date_text', 'Date')}
          timeTitle={t('time_text', 'Time')}
          applyText={t('apply_text', '') || undefined}
          noTimeText={t('no_time_text', '') || undefined}
        />
      ) : null}
    </div>
  );
};

/**
 * Радио-карточка одного payment-аккаунта.
 */
const PaymentMethodOption = ({
  account,
  checked,
  onSelect,
}: {
  account: IAccountsEntity;
  checked: boolean;
  onSelect: () => void;
}): JSX.Element => {
  const id = `pay-${account.identifier}`;
  const label = account.localizeInfos?.title ?? account.identifier;
  const type = account.type?.toLowerCase();

  return (
    <div className="flex items-center gap-2.5 text-paper">
      <input
        type="radio"
        id={id}
        name="payment-method"
        checked={checked}
        onChange={onSelect}
        className="hidden peer"
      />
      <label htmlFor={id} className="radio-custom flex cursor-pointer select-none items-center">
        <span className="ml-2 text-paper capitalize">{label}</span>
      </label>
      {type === 'paypal' && (
        <Image src="/images/icons/paypal.png" alt="PayPal" width={68} height={18} />
      )}
      {type === 'stripe' && (
        <>
          <Image src="/images/icons/visa.png" alt="Visa" width={36} height={12} />
          <Image src="/images/icons/mastercart.png" alt="Mastercard" width={28} height={18} />
        </>
      )}
    </div>
  );
};

export default StepPayment;
