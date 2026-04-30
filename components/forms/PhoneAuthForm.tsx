'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { getApi, isError } from '@/app/api';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import ErrorMessage from './inputs/ErrorMessage';

type PhoneAuthFormProps = {
  dict?: IAttributeValues;
};

/**
 * Форма sign-in по номеру телефона (по `cart_Sign_in_tel.html`).
 *
 * Поле телефона + кнопка SIGN IN + строка "Forgot Password?" + вторичная
 * кнопка CREATE AN ACCOUNT. На сабмит триггерит генерацию OTP в OneEntry через
 * `AuthProvider.generateCode('phone', ...)` и открывает форму Verification.
 * @param   {PhoneAuthFormProps} props - Пропсы компонента.
 * @returns {JSX.Element}              JSX формы.
 */
const PhoneAuthForm = ({ dict }: PhoneAuthFormProps): JSX.Element => {
  const { setComponent, setAction } = useContext(OpenDrawerContext);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getApi().AuthProvider.generateCode(
        'phone',
        phone.trim(),
        'generate_otp',
      );
      if (isError(res)) {
        setError(
          (res as { message?: string }).message ??
            'Could not send the code. Please try again.',
        );
      } else {
        setComponent('VerificationForm');
        setAction('checkCode');
      }
    } catch (e_: unknown) {
      setError(
        (e_ as { message?: string }).message ??
          'Could not send the code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xl leading-5">
      <div className="flex flex-col gap-2 border-b border-b-muted">
        <label
          htmlFor="phone_auth_number"
          className="font-normal text-[18px] text-custom_white"
        >
          Phone number
        </label>
        <input
          id="phone_auth_number"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          placeholder="+7 ( )"
          className="cart_input placeholder:font-semibold"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cart_btn mt-42.5 bg-custom_btnorange hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? '...' : 'SIGN IN'}
      </button>

      <div className="mt-6.25 flex items-center justify-between">
        <p className="font-normal text-[18px] text-white">
          {(dict?.forgot_password_text?.value as string) ?? 'Forgot Password?'}
        </p>
        <button
          type="button"
          onClick={() => setComponent('ResetPasswordForm')}
          className="border-b border-b-brand pb-0.5 font-semibold text-[18px] text-brand"
        >
          {(dict?.reset_password_text?.value as string) ?? 'Reset Password'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setComponent('SignUpForm')}
        className="mt-12.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-[10px] border border-brand bg-transparent text-center font-semibold text-[17px] text-brand hover_btn_white"
      >
        {(dict?.create_account_text?.value as string) ?? 'CREATE AN ACCOUNT'}
      </button>

      {error ? <ErrorMessage error={error} /> : null}
    </form>
  );
};

export default PhoneAuthForm;
