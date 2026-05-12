'use client';

import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useCreateOrder, useGetAccountsQuery, useGetFormByMarkerQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectDeliveryData, setDeliveryData } from '@/app/store/reducers/CartSlice';
import { addData, addPaymentMethod, setStep, setStepError } from '@/app/store/reducers/OrderSlice';
import { toLocalIsoDate } from '@/app/utils/formatDate';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';

import AddressRow from './step-payment/AddressRow';
import { ADDRESS_MARKERS, type DeliveryMode, PHONE_MARKERS } from './step-payment/constants';
import PaymentMethodsList from './step-payment/PaymentMethodsList';
import {
  formatAddressLine,
  parseSavedAddresses,
  pickSelectedAddress,
} from './step-payment/savedAddress';
import {
  buildDeliveryTimeInterval,
  formatScheduleAt,
  parseScheduleAt,
} from './step-payment/scheduleTime';
import TimeRow from './step-payment/TimeRow';
import { usePaymentStepAnimations } from './step-payment/usePaymentStepAnimations';
import { findUserField } from './step-payment/userFields';

/**
 * StepPayment — checkout step: address + time + payment on a single screen.
 *
 * @returns JSX of the payment step body.
 */
const StepPayment = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { onConfirmOrder, isLoading } = useCreateOrder();
  const { user, isAuth } = useContext(AuthContext);
  const { setOpen, setComponent, setAction } = useContext(OpenDrawerContext);
  const delivery = useAppSelector(selectDeliveryData);

  // Form-field placeholders come from `additionalFields.placeholder.value`, not static_content.
  const { data: deliveryForm } = useGetFormByMarkerQuery({ marker: 'delivery_order' });
  const fieldPlaceholder = (marker: string): string => {
    const attr = deliveryForm?.attributes?.find(a => a.marker === marker);
    return String(attr?.additionalFields?.placeholder?.value ?? '');
  };

  // Structured `user_address` (street+house+floor) takes priority over flat markers - otherwise the input only contains the street.
  const savedAddresses = useMemo(() => parseSavedAddresses(user?.formData), [user?.formData]);
  const initialPickedAddress = useMemo(() => pickSelectedAddress(savedAddresses), [savedAddresses]);
  const userAddressFlat = findUserField(user?.formData, ADDRESS_MARKERS);
  const userAddress = formatAddressLine(initialPickedAddress) || userAddressFlat;
  const userPhone = findUserField(user?.formData, PHONE_MARKERS);

  const [address, setAddress] = useState((delivery?.address as string | undefined) || userAddress);
  // `user.formData` arrives async - empty on the first render; if the user has not edited the input manually, pull it in once available.
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
  const todayIso = useMemo(() => toLocalIsoDate(), []);

  /**
   * onAddAddressClick — opens the profile drawer (or auth picker for guests).
   *
   * Signals the profile popup via `action='add-address'` so `ProfileSections` collapses
   * "My Profile" and expands the Address / add-form sections on mount.
   *
   * @returns Nothing.
   */
  const onAddAddressClick = (): void => {
    setOpen(true);
    setComponent(isAuth ? 'ProfilePopup' : 'AuthProviderSelect');
    if (isAuth) setAction('add-address');
  };

  /**
   * onAddressChange — updates the address input and marks it as touched so the auto-fill effect stops overriding it.
   *
   * @param   {string} next - New address value.
   * @returns Nothing.
   */
  const onAddressChange = (next: string): void => {
    setAddress(next);
    setAddressTouched(true);
  };

  /**
   * onPickSavedAddress — fills the order address input with a saved-address line.
   *
   * @param   {string} line - Pre-formatted address string (`formatAddressLine`).
   * @returns Nothing.
   */
  const onPickSavedAddress = (line: string): void => {
    setAddress(line);
    setAddressTouched(true);
  };

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

  const containerRef = useRef<HTMLDivElement>(null);
  usePaymentStepAnimations(containerRef);

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
    <div ref={containerRef} className="flex flex-col gap-5">
      <AddressRow
        address={address}
        onAddressChange={onAddressChange}
        savedAddresses={savedAddresses}
        onPickSaved={onPickSavedAddress}
        onAddAddressClick={onAddAddressClick}
        placeholder={fieldPlaceholder('delivery_address')}
      />

      <TimeRow
        mode={mode}
        onModeChange={setMode}
        scheduleAt={scheduleAt}
        onSchedulePickerOpen={() => {
          setMode('scheduled');
          setPickerOpen(true);
        }}
        placeholder={fieldPlaceholder('delivery_time')}
      />

      <PaymentMethodsList
        accounts={accounts}
        isLoading={isAccountsLoading}
        identifier={identifier}
        onSelect={setIdentifier}
      />

      <input
        type="text"
        value={comment}
        onChange={e => setComment(e.currentTarget.value)}
        placeholder={fieldPlaceholder('comment')}
        className="step-payment-row text-base text-paper placeholder:text-muted-text focus:placeholder:text-transparent border border-paper p-1.25 rounded-card bg-transparent focus:outline-none"
      />

      <label className="step-payment-row custom-checkbox text-[14px] text-paper">
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
          placeholder={fieldPlaceholder('alt_phone')}
          className="step-payment-row text-base text-paper placeholder:text-muted-text focus:placeholder:text-transparent border border-paper p-1.25 rounded-card bg-transparent focus:outline-none"
        />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading || !identifier || !address.trim() || (altReceiver && !altPhone.trim())}
        className="step-payment-row cart_btn mt-3.75 mx-auto w-60 disabled:opacity-60"
      >
        {isLoading ? t('processing_text', 'Processing...') : t('apply_coupon_button', 'APPLY')}
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
          dateTitle={t('date_text', 'Date')}
          timeTitle={t('time_text', 'Time')}
          applyText={t('apply_text', '') || undefined}
          continueText={t('continue_text', '') || undefined}
          noTimeText={t('no_time_text', '') || undefined}
        />
      ) : null}
    </div>
  );
};

export default StepPayment;
