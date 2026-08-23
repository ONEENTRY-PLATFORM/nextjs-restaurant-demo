'use client';

import type { IFormAttribute } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useCreateOrder, useDeliveryCheckout } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectDeliveryData, setDeliveryData } from '@/app/store/reducers/CartSlice';
import {
  addData,
  addPaymentMethod,
  setOrderForm,
  setStep,
  setStepError,
} from '@/app/store/reducers/OrderSlice';
import { toLocalIsoDate } from '@/app/utils/formatDate';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';
import DateTimePickerSheet from '@/components/ui/DateTimePickerSheet';
import { getFormAttributes } from '@/components/utils';

import AddressRow from './step-payment/AddressRow';
import { ADDRESS_MARKERS, type DeliveryMode, PHONE_MARKERS } from './step-payment/constants';
import { inputTypeForAttribute, selectGenericFields } from './step-payment/deliveryFields';
import {
  buildDeliveryTimeInterval,
  makeGetSlots,
  parseDeliverySchedule,
  type TimeIntervalAttribute,
} from './step-payment/deliverySlots';
import PaymentMethodsList from './step-payment/PaymentMethodsList';
import {
  formatAddressLine,
  parseSavedAddresses,
  pickSelectedAddress,
} from './step-payment/savedAddress';
import { formatScheduleAt, parseScheduleAt } from './step-payment/scheduleTime';
import TimeRow from './step-payment/TimeRow';
import { usePaymentStepAnimations } from './step-payment/usePaymentStepAnimations';
import { findUserField } from './step-payment/userFields';

/**
 * StepPayment — checkout step: address + time + payment on a single screen.
 *
 * The order storage / form / payment methods are resolved dynamically via `useDeliveryCheckout`
 * (no hard-coded `delivery_order` marker): field placeholders/labels and the time slots come from
 * the form schema, each designed row is gated on its form attribute being present, and any extra
 * visible attribute is rendered as a generic input so newly-added admin fields appear automatically.
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

  const {
    storageMarker,
    formIdentifier,
    form,
    accounts,
    isLoading: isCheckoutLoading,
  } = useDeliveryCheckout();

  // Persist the resolved storage/form markers so `useCreateOrder` targets the admin-configured
  // storage instead of the `delivery_order` constant.
  useEffect(() => {
    dispatch(setOrderForm({ storageMarker, formIdentifier }));
  }, [dispatch, storageMarker, formIdentifier]);

  const attrByMarker = useMemo(() => {
    const map = new Map<string, IFormAttribute>();
    getFormAttributes(form).forEach(a => map.set(a.marker, a));
    return map;
  }, [form]);

  const hasField = (marker: string): boolean => {
    const attr = attrByMarker.get(marker);
    return Boolean(attr && attr.isVisible !== false);
  };
  // Field-level metadata comes from the form schema (placeholder from `additionalFields`, label
  // from `localizeInfos.title`), not static_content or hard-coded strings.
  const fieldPlaceholder = (marker: string): string => {
    const attr = attrByMarker.get(marker);
    return String(attr?.additionalFields?.placeholder?.value ?? '');
  };

  // Available delivery slots are read from the `delivery_time` attribute's interval schedule.
  const schedule = useMemo(
    () =>
      parseDeliverySchedule(
        attrByMarker.get('delivery_time') as unknown as TimeIntervalAttribute | undefined
      ),
    [attrByMarker]
  );
  const getSlots = useMemo(() => makeGetSlots(schedule), [schedule]);

  // Extra visible attributes not covered by the bespoke rows — rendered generically (by type/position).
  const genericFields = useMemo(() => selectGenericFields(getFormAttributes(form)), [form]);

  // Structured `user_address` (street+house+floor) takes priority over flat markers - otherwise the input only contains the street.
  const savedAddresses = useMemo(() => parseSavedAddresses(user?.formData), [user?.formData]);
  const initialPickedAddress = useMemo(() => pickSelectedAddress(savedAddresses), [savedAddresses]);
  const userAddressFlat = findUserField(user?.formData, ADDRESS_MARKERS);
  const userAddress = formatAddressLine(initialPickedAddress) || userAddressFlat;
  const userPhone = findUserField(user?.formData, PHONE_MARKERS);

  // OAuth-registered users have no phone in `formData`, while `contact_phone` is a required form
  // field — without a visible input the order request fails with 400. The input mirrors the profile
  // phone once it arrives async and stops syncing after a manual edit (same pattern as the address).
  const [phone, setPhone] = useState(userPhone);
  const [phoneTouched, setPhoneTouched] = useState(false);
  useEffect(() => {
    if (phoneTouched || !userPhone) return;
    // Sync-with-async-data: the profile phone arrives after mount and must seed the
    // input until the user edits it — a useState initializer cannot see later updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhone(userPhone);
  }, [phoneTouched, userPhone]);

  const [address, setAddress] = useState((delivery?.address as string | undefined) || userAddress);
  // `user.formData` arrives async - empty on the first render; if the user has not edited the input manually, pull it in once available.
  const [addressTouched, setAddressTouched] = useState<boolean>(
    Boolean(delivery?.address as string | undefined)
  );
  useEffect(() => {
    if (addressTouched) return;
    const next = formatAddressLine(initialPickedAddress) || userAddressFlat;
    // Sync-with-async-data: the saved address arrives after mount (same pattern as the phone).
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

  const [identifier, setIdentifier] = useState('');
  const [comment, setComment] = useState('');
  const [altReceiver, setAltReceiver] = useState(false);
  const [altPhone, setAltPhone] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!identifier && accounts.length > 0) {
      // Sync-with-async-data: payment accounts load async — pick the first as the
      // default selection once, without clobbering a user choice.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdentifier(accounts[0]!.identifier);
    }
  }, [accounts, identifier]);

  const containerRef = useRef<HTMLDivElement>(null);
  usePaymentStepAnimations(containerRef);

  const addressRequired = hasField('delivery_address');
  const phoneRequired =
    hasField('contact_phone') &&
    attrByMarker.get('contact_phone')?.validators?.requiredValidator?.strict === true;

  const onNext = async () => {
    if (!identifier) return;
    if (addressRequired && !address.trim()) return;
    if (phoneRequired && !phone.trim()) return;

    const deliveryTime = mode === 'asap' ? '40-45 min' : scheduleAt || '';
    const deliveryInterval = buildDeliveryTimeInterval(mode, scheduleAt, schedule);
    dispatch(setDeliveryData({ ...delivery, address, time: deliveryTime }));
    if (hasField('delivery_address')) {
      dispatch(addData({ marker: 'delivery_address', type: 'string', value: address }));
    }
    if (hasField('contact_phone') && phone.trim()) {
      dispatch(addData({ marker: 'contact_phone', type: 'string', value: phone.trim() }));
    }
    if (hasField('delivery_time') && deliveryInterval) {
      dispatch(addData({ marker: 'delivery_time', type: 'timeInterval', value: deliveryInterval }));
    }
    if (hasField('comment') && comment.trim()) {
      dispatch(addData({ marker: 'comment', type: 'string', value: comment.trim() }));
    }
    if (hasField('alt_phone') && altReceiver && altPhone.trim()) {
      dispatch(addData({ marker: 'alt_phone', type: 'string', value: altPhone.trim() }));
    }
    genericFields.forEach(attr => {
      const value = extra[attr.marker]?.trim();
      if (value) dispatch(addData({ marker: attr.marker, type: attr.type, value }));
    });

    dispatch(addPaymentMethod(identifier));
    const selectedType = accounts.find(a => a.identifier === identifier)?.type;
    const result = await onConfirmOrder({
      paymentAccountIdentifier: identifier,
      paymentAccountType: selectedType,
    });
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
      {hasField('delivery_address') ? (
        <AddressRow
          address={address}
          onAddressChange={onAddressChange}
          savedAddresses={savedAddresses}
          onPickSaved={onPickSavedAddress}
          onAddAddressClick={onAddAddressClick}
          placeholder={fieldPlaceholder('delivery_address')}
        />
      ) : null}

      {hasField('contact_phone') && (!userPhone || phoneTouched) ? (
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={e => {
            setPhone(e.currentTarget.value);
            setPhoneTouched(true);
          }}
          placeholder={
            fieldPlaceholder('contact_phone') ||
            attrByMarker.get('contact_phone')?.localizeInfos?.title ||
            'Contact phone'
          }
          className="step-payment-row rounded-card border border-paper bg-transparent p-1.25 text-base text-paper placeholder:text-muted-text focus:outline-none focus:placeholder:text-transparent"
        />
      ) : null}

      {hasField('delivery_time') ? (
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
      ) : null}

      <PaymentMethodsList
        accounts={accounts}
        isLoading={isCheckoutLoading}
        identifier={identifier}
        onSelect={setIdentifier}
      />

      {hasField('comment') ? (
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.currentTarget.value)}
          placeholder={fieldPlaceholder('comment')}
          className="step-payment-row rounded-card border border-paper bg-transparent p-1.25 text-base text-paper placeholder:text-muted-text focus:outline-none focus:placeholder:text-transparent"
        />
      ) : null}

      {hasField('alt_phone') ? (
        <>
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
              className="step-payment-row rounded-card border border-paper bg-transparent p-1.25 text-base text-paper placeholder:text-muted-text focus:outline-none focus:placeholder:text-transparent"
            />
          )}
        </>
      ) : null}

      {genericFields.map(attr => (
        <input
          key={attr.marker}
          type={inputTypeForAttribute(attr.type)}
          value={extra[attr.marker] ?? ''}
          onChange={e => setExtra(prev => ({ ...prev, [attr.marker]: e.currentTarget.value }))}
          placeholder={fieldPlaceholder(attr.marker) || attr.localizeInfos?.title || attr.marker}
          className="step-payment-row rounded-card border border-paper bg-transparent p-1.25 text-base text-paper placeholder:text-muted-text focus:outline-none focus:placeholder:text-transparent"
        />
      ))}

      <button
        type="button"
        onClick={onNext}
        disabled={
          isLoading ||
          !identifier ||
          (addressRequired && !address.trim()) ||
          (phoneRequired && !phone.trim()) ||
          (altReceiver && !altPhone.trim())
        }
        className="step-payment-row cart_btn mx-auto mt-3.75 w-60 disabled:opacity-60"
      >
        {isLoading ? t('processing_text', 'Processing...') : t('apply_coupon_button', 'APPLY')}
      </button>

      {pickerOpen ? (
        <DateTimePickerSheet
          date={parseScheduleAt(scheduleAt).date}
          time={parseScheduleAt(scheduleAt).time}
          minDate={todayIso}
          getSlots={getSlots}
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
