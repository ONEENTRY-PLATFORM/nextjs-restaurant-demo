'use client';

import Image from 'next/image';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { selectDeliveryData, setDeliveryData } from '@/app/store/reducers/CartSlice';
import { addData, setStep } from '@/app/store/reducers/OrderSlice';
import ClockCircleIcon from '@/components/icons/clock-circle';
import PencilIcon from '@/components/icons/pencil';

// Маркеры, которые мы ищем в профиле пользователя, в порядке приоритета. `address_reg` —
// канонический, используется в других местах корзины (см. components/layout/cart/
// index.tsx); остальные — fallback, если админ переименовал поле.
const ADDRESS_MARKERS = ['address_reg', 'address', 'delivery_address'] as const;
const PHONE_MARKERS = ['phone', 'phone_reg', 'contact_phone'] as const;

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
 * Шаг checkout — адрес доставки + режим времени доставки (по блокам Address + Time
 * из `cart_PAYMENT.html`).
 *
 * Адрес: text input с иконкой-карандашом редактирования справа.
 * Время: два радио — "40-45 min" (ASAP) или "by the time" (по расписанию,
 * text input типа `18.06.24 10.00`).
 * @returns {JSX.Element} JSX шага.
 */
const StepAddress = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const delivery = useAppSelector(selectDeliveryData);
  const { user } = useContext(AuthContext);
  // Пре-заполняем адрес из профиля авторизованного пользователя, если
  // пользователь ещё не ввёл его в этом checkout. `formData` хранит
  // значения атрибутов OneEntry; маркеры проверяются в порядке приоритета.
  const userAddress = findUserField(user?.formData, ADDRESS_MARKERS);
  const userPhone = findUserField(user?.formData, PHONE_MARKERS);
  const [address, setAddress] = useState((delivery?.address as string | undefined) || userAddress);
  const [mode, setMode] = useState<DeliveryMode>('asap');
  const [scheduleAt, setScheduleAt] = useState<string>('');

  const onNext = () => {
    dispatch(
      setDeliveryData({
        ...delivery,
        address,
        time:
          mode === 'asap'
            ? '40-45 min'
            : scheduleAt || (delivery?.time as string | undefined) || '',
      })
    );
    // Пушим обязательные поля формы `delivery_order` в order.formData —
    // без них createOrder возвращает 400 (`required values are missing or
    // incorrect: contact_phone` / `delivery_address`). Телефон берём из
    // профиля пользователя (он на этом шаге уже авторизован — иначе
    // визард не добрался бы до address).
    dispatch(addData({ marker: 'delivery_address', type: 'string', value: address }));
    if (userPhone) {
      dispatch(addData({ marker: 'contact_phone', type: 'string', value: userPhone }));
    }
    dispatch(setStep('order'));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Хедер Address */}
      <div className="flex items-center gap-2.5 text-paper">
        <Image src="/images/icons/pin.svg" alt="" width={17} height={19} />
        <p className="font-normal text-[20px] text-paper">{t('address_text', 'Address')}</p>
      </div>

      {/* Инпут адреса с карандашом */}
      <div className="relative flex items-center gap-2.5 text-paper">
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.currentTarget.value)}
          placeholder="OneEntry str."
          className="w-full rounded-[5px] border border-paper bg-transparent p-1.25 text-[16px] text-paper placeholder:text-[#a8a9b5] focus:outline-none"
        />
        <PencilIcon className="absolute right-1.75 top-1.75 pointer-events-none" />
      </div>

      {/* Хедер Time */}
      <div className="mt-5 flex items-center gap-2.5 text-paper">
        <ClockCircleIcon variant="paper" />
        <p className="font-normal text-[20px] text-paper">{t('time_text', 'Time')}</p>
      </div>

      {/* Радио ASAP */}
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

      {/* Радио по расписанию + инпут */}
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
          onChange={e => {
            setScheduleAt(e.currentTarget.value);
            setMode('scheduled');
          }}
          placeholder="18.06.24  10.00"
          className="rounded-[5px] border border-white bg-transparent px-1.25 text-brand opacity-80 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!address.trim()}
        className="cart_btn disabled:opacity-60"
      >
        Continue
      </button>
    </div>
  );
};

export default StepAddress;
