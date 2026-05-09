'use client';

import Image from 'next/image';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';
import { toast } from 'react-toastify';

import { logInUser, useGetAuthProvidersQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import {
  getProviderMeta,
  sortActiveAuthProviders,
  startGoogleOAuth,
} from '@/components/forms/authProviders';
import ErrorMessage from '@/components/forms/inputs/ErrorMessage';

import {
  clearPendingReservationResume,
  setPendingReservationResume,
} from './reservationOAuthResumeState';

type ReservationAuthStepProps = {
  /** Callback fired on successful auth — switches the wizard step to `payment`. */
  onAuthSuccess: () => void;
  onBack: () => void;
  /** Current booking form values; persisted to sessionStorage before the OAuth redirect. */
  currentValues: Record<string, string>;
};

type SubStep = 'providers' | 'email';

/**
 * ReservationAuthStep — auth step inside the booking popup.
 *
 * Implemented inline (without `OpenDrawerContext.setComponent`) to avoid
 * tearing down the mounted `ReservationPopup` and losing the collected
 * form values. Two sub-steps: `providers` → `email`.
 *
 * @param   {ReservationAuthStepProps} props - Step props.
 * @returns {JSX.Element}                    Auth step JSX.
 */
const ReservationAuthStep = ({
  onAuthSuccess,
  onBack,
  currentValues,
}: ReservationAuthStepProps): JSX.Element => {
  const t = useT();
  const { authenticate } = useContext(AuthContext);
  const { data: providers, isLoading: isProvidersLoading } = useGetAuthProvidersQuery('');

  const [subStep, setSubStep] = useState<SubStep>('providers');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persistResumeBeforeOAuth = () => {
    setPendingReservationResume({
      values: currentValues,
      returnTo:
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/',
    });
  };

  const onProviderClick = (p: IAuthProvidersEntity) => {
    if (p.identifier === 'email' || p.identifier === 'phone') {
      setSubStep('email');
      return;
    }
    if (p.identifier === 'google') {
      persistResumeBeforeOAuth();
      if (!startGoogleOAuth(p.config?.oauthAuthUrl)) {
        // Google OAuth is not configured (MISMATCH-LOG §C.8.1) — fall back to the email form. Clear resume.
        clearPendingReservationResume();
        setSubStep('email');
      }
      return;
    }
    if (p.type === 'oauth' && p.config?.oauthAuthUrl) {
      persistResumeBeforeOAuth();
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = p.config.oauthAuthUrl;
      return;
    }
    setSubStep('email');
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    try {
      const result = await logInUser({ method: 'email', login: email, password });
      if (result?.error) {
        throw new Error(result.error);
      }
      authenticate();
      toast(t('signed_in_toast', 'You signed in!'));
      onAuthSuccess();
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (subStep === 'providers') {
    const active = sortActiveAuthProviders(providers ?? []);
    return (
      <div className="flex w-full flex-col items-center px-5 md:px-19">
        <p className="text-center font-normal text-[16px] leading-5 text-paper">
          {t('booking_signin_prompt', 'Please sign in to confirm your booking.')}
        </p>
        <div className="mt-2.5 flex w-full flex-col">
          {active.map((p, idx) => {
            const meta = getProviderMeta(p);
            const isPrimary = idx === 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProviderClick(p)}
                disabled={isProvidersLoading}
                className={
                  isPrimary
                    ? 'mt-6.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-[10px] border-none bg-custom_btnorange text-center font-semibold text-[17px] text-white transition-all duration-700 hover:bg-brand-hover disabled:opacity-60'
                    : 'cart_btn disabled:opacity-60'
                }
              >
                <div className="flex w-50 items-center justify-start gap-5 font-bold text-base">
                  <Image src={meta.icon} alt="" width={meta.iconWidth} height={meta.iconHeight} />
                  <span>{meta.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-7.5 flex h-9 items-center justify-center rounded-[5px] border border-paper px-5 font-normal text-[16px] text-paper hover:opacity-80"
        >
          {t('back_text', 'Back')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5 px-5 md:px-19">
      <p className="text-center font-normal text-[16px] leading-5 text-paper">
        {t('booking_signin_prompt', 'Please sign in to confirm your booking.')}
      </p>

      <div className="flex flex-col border-b border-b-muted">
        <label htmlFor="reservation-auth-email" className="font-normal text-[16px] text-paper">
          {t('email_label', 'Email')}
        </label>
        <input
          type="email"
          id="reservation-auth-email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={ev => setEmail(ev.currentTarget.value)}
          className="cart_input"
          required
        />
      </div>

      <div className="flex flex-col border-b border-b-muted">
        <label htmlFor="reservation-auth-password" className="font-normal text-[16px] text-paper">
          {t('password_label', 'Password')}
        </label>
        <input
          type="password"
          id="reservation-auth-password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={ev => setPassword(ev.currentTarget.value)}
          className="cart_input"
          required
        />
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      <div className="mt-2.5 flex items-center justify-center gap-3.75">
        <button
          type="button"
          onClick={() => setSubStep('providers')}
          className="flex h-9 items-center justify-center rounded-[5px] border border-paper px-5 font-normal text-[16px] text-paper hover:opacity-80"
        >
          {t('back_text', 'Back')}
        </button>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex h-9 min-w-25 items-center justify-center rounded-[5px] border border-brand px-5 font-normal text-[16px] text-brand hover:bg-brand/10 disabled:opacity-60"
        >
          {loading ? '...' : t('sign_in_text', 'Sign in')}
        </button>
      </div>
    </form>
  );
};

export default ReservationAuthStep;
