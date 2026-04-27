'use client';

import type { FormEvent, JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getApi, isError } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import { setStep } from '@/app/store/reducers/OrderSlice';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

type AuthTab = 'options' | 'phone';

/**
 * Checkout step — gate for authentication.
 *
 * If the user is already authenticated, auto-advances to `address`.
 * Otherwise presents 3 options:
 *   - Login (opens email SignInForm modal);
 *   - Phone (reveals inline {@link PhoneAuthForm});
 *   - Sign up (opens SignUpForm modal).
 * @returns {JSX.Element} Step JSX.
 */
const StepSignIn = (): JSX.Element => {
  const { isAuth, isLoading } = useContext(AuthContext);
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<AuthTab>('options');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (isAuth) {
      dispatch(setStep('address'));
    }
  }, [isAuth, dispatch]);

  if (isLoading) {
    return <div className="text-paper/80 text-center">Loading...</div>;
  }

  const onPhoneSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number.');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');
    try {
      const res = await getApi().AuthProvider.generateCode(
        'phone',
        phone.trim(),
        'generate_otp',
      );
      if (isError(res)) {
        setPhoneError(
          (res as { message?: string }).message ??
            'Could not send the code. Please try again.',
        );
        return;
      }
      dispatch(addField({ phone: { valid: true, value: phone.trim() } }));
      dispatch(setStep('verification'));
    } catch (err: unknown) {
      setPhoneError(
        (err as { message?: string }).message ??
          'Could not send the code. Please try again.',
      );
    } finally {
      setPhoneLoading(false);
    }
  };

  if (tab === 'phone') {
    return (
      <form onSubmit={onPhoneSubmit} className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setTab('options')}
          className="self-start text-sm text-paper/70 hover:text-brand"
        >
          ← Back
        </button>
        <div className="flex flex-col gap-2 border-b border-b-muted">
          <label
            htmlFor="cart_phone_auth"
            className="font-normal text-[18px] text-custom_white"
          >
            Phone number
          </label>
          <input
            id="cart_phone_auth"
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
          disabled={phoneLoading}
          className="cart_btn mt-10 disabled:opacity-60"
        >
          {phoneLoading ? '...' : 'SIGN IN'}
        </button>
        {phoneError ? <ErrorMessage error={phoneError} /> : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-center font-bold text-[20px] uppercase text-brand">
        Sign in to continue
      </h2>
      <p className="text-paper/90 text-center">
        Please sign in or create an account to place your order.
      </p>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setComponent('SignInForm');
          }}
          className="flex h-[37px] w-[125px] items-center justify-center rounded-[5px] bg-custom_transparent font-normal text-[17px] text-brand backdrop-blur-[10px] hover_btn_transp"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setTab('phone')}
          className="flex h-[37px] w-[125px] items-center justify-center rounded-[5px] border border-brand font-normal text-[17px] text-brand hover_btn_white"
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setComponent('SignUpForm');
          }}
          className="flex h-[37px] w-[125px] items-center justify-center rounded-[5px] bg-custom_btnorange font-normal text-[17px] text-custom_white backdrop-blur-[10px] hover_btn_transp"
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default StepSignIn;
