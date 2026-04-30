'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import OtpInput from 'react-otp-input';

import { api, isError } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setStep, setStepError } from '@/app/store/reducers/OrderSlice';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

/**
 * Шаг checkout — phone OTP верификация (по `cart_Verification.html`).
 *
 * Читает номер телефона, введённый во вкладке phone {@link StepSignIn}
 * (`formFieldsReducer.fields.phone`), принимает 6-значный OTP и верифицирует его
 * через `AuthProvider.checkCode('phone', ...)`. При успехе переходит на
 * `address`; при провале показывает инлайн-ошибку и даёт пользователю переотправить.
 * @returns {JSX.Element} JSX шага.
 */
const StepVerification = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const phone = useAppSelector(
    (state) =>
      (state.formFieldsReducer.fields.phone?.value as string | undefined) ?? '',
  );
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.AuthProvider.checkCode('phone', phone, 'otp', otp);
      if (isError(res)) {
        setError(
          (res as { message?: string }).message ?? 'Invalid code. Try again.',
        );
        return;
      }
      dispatch(setStep('address'));
    } catch (e: unknown) {
      const message =
        (e as { message?: string }).message ?? 'Verification failed.';
      setError(message);
      dispatch(setStepError(message));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!phone) {
      setError('Phone number is missing — please go back and re-enter it.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.AuthProvider.generateCode(
        'phone',
        phone,
        'generate_otp',
      );
      if (isError(res)) {
        setError(
          (res as { message?: string }).message ?? 'Could not resend the code.',
        );
      }
    } catch (e: unknown) {
      setError(
        (e as { message?: string }).message ?? 'Could not resend the code.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="font-normal text-[20px] text-white">
        Enter your OTP code here
      </p>
      <OtpInput
        value={otp}
        onChange={setOtp}
        numInputs={6}
        renderInput={(props) => <input {...props} />}
        containerStyle="flex justify-between mx-auto h-[60px] mt-5"
        inputStyle="!w-10 h-15 border border-white rounded-[5px] bg-transparent text-center text-[24px] text-paper opacity-90 focus:outline-none"
      />
      <p className="mt-2.5 flex justify-end font-normal text-[18px] text-white">
        Did not receive the OTP?
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="font-semibold uppercase text-brand disabled:opacity-60"
        >
          &nbsp;&nbsp;RESEND
        </button>
      </p>
      <button
        type="button"
        onClick={onVerify}
        disabled={loading || otp.length !== 6}
        className="hover_btn_white mt-16 flex h-15 w-full items-center justify-center gap-6.25 rounded-[10px] border border-brand bg-transparent text-center font-semibold text-[17px] uppercase text-brand disabled:opacity-60"
      >
        {loading ? '...' : 'Verify now'}
      </button>
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  );
};

export default StepVerification;
