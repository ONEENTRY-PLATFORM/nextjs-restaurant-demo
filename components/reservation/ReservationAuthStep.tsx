'use client';

import Image from 'next/image';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { JSX } from 'react';

import { useGetAuthProvidersQuery } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import {
  getProviderMeta,
  sortActiveAuthProviders,
  startGoogleOAuth,
} from '@/components/forms/authProviders';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';
import SignInForm from '@/components/forms/SignInForm';
import SignUpForm from '@/components/forms/SignUpForm';
import VerificationForm from '@/components/forms/VerificationForm';

import {
  clearPendingReservationResume,
  setPendingReservationResume,
} from './reservationOAuthResumeState';
import type { AuthSubStep } from './reservationTypes';

type ReservationAuthStepProps = {
  /** Callback fired on successful auth - switches the wizard step to `payment`. */
  onAuthSuccess: () => void;
  /** Current booking form values; persisted to sessionStorage before the OAuth redirect. */
  currentValues: Record<string, string>;
  /** Auth sub-step controlled by the popup so its header arrow can navigate `sign-in` → `providers`, etc. */
  subStep: AuthSubStep;
  setSubStep: (s: AuthSubStep) => void;
};

/**
 * ReservationAuthStep — inline auth wizard inside the booking popup.
 *
 * @param   {ReservationAuthStepProps}    props                - Component props.
 * @param   {() => void}                  props.onAuthSuccess  - Callback fired on successful auth (switches the wizard step to `payment`).
 * @param   {Record<string, string>}      props.currentValues  - Current booking form values; persisted to sessionStorage before OAuth redirect.
 * @param   {AuthSubStep}                 props.subStep        - Active inner sub-step (controlled by the popup).
 * @param   {(s: AuthSubStep) => void}    props.setSubStep     - Setter for the inner sub-step (controlled by the popup).
 * @returns JSX of the providers list or the form for the current sub-step.
 */
const ReservationAuthStep = ({
  onAuthSuccess,
  currentValues,
  subStep,
  setSubStep,
}: ReservationAuthStepProps): JSX.Element => {
  const t = useT();
  const { data: providers, isLoading: isProvidersLoading } = useGetAuthProvidersQuery('');

  const persistResumeBeforeOAuth = () => {
    setPendingReservationResume({
      values: currentValues,
      returnTo:
        typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/',
    });
  };

  const onProviderClick = (p: IAuthProvidersEntity) => {
    if (p.identifier === 'email' || p.identifier === 'phone') {
      setSubStep('sign-in');
      return;
    }
    if (p.identifier === 'google') {
      persistResumeBeforeOAuth();
      if (!startGoogleOAuth(p)) {
        // Google OAuth is not configured (MISMATCH-LOG §C.8.1) - fall back to the email form. Clear resume.
        clearPendingReservationResume();
        setSubStep('sign-in');
      }
      return;
    }
    if (p.type === 'oauth' && p.config?.oauthAuthUrl) {
      persistResumeBeforeOAuth();
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = p.config.oauthAuthUrl;
      return;
    }
    setSubStep('sign-in');
  };

  if (subStep === 'providers') {
    const active = sortActiveAuthProviders(providers ?? []);
    return (
      <div className="flex w-full flex-col items-center px-5 md:px-19">
        <p className="text-center text-base leading-5 font-normal text-paper">
          {t('booking_signin_prompt', 'Please sign in to confirm your booking.')}
        </p>
        <div className="mt-2.5 flex w-full flex-col">
          {active.map(p => {
            const meta = getProviderMeta(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProviderClick(p)}
                disabled={isProvidersLoading}
                className="mt-6.5 flex h-14 w-full items-center justify-center gap-6.25 rounded-panel border-none bg-disabled-bg text-center text-[17px] font-semibold text-white backdrop-blur-card transition-all duration-700 hover:bg-brand active:bg-brand-active disabled:bg-disabled-bg-soft disabled:text-ink"
              >
                <div className="flex w-50 items-center justify-start gap-5 text-base font-bold">
                  <Image src={meta.icon} alt="" width={meta.iconWidth} height={meta.iconHeight} />
                  <span>{meta.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 px-5 md:px-19">
      <p className="text-center text-base leading-5 font-normal text-paper">
        {t('booking_signin_prompt', 'Please sign in to confirm your booking.')}
      </p>

      {subStep === 'sign-in' ? (
        <SignInForm
          className={''}
          isActive={true}
          onSuccess={onAuthSuccess}
          onCreateAccount={() => setSubStep('sign-up')}
          onResetPassword={() => setSubStep('forgot-password')}
        />
      ) : null}

      {subStep === 'sign-up' ? (
        <SignUpForm
          onSuccess={onAuthSuccess}
          onNeedActivation={() => setSubStep('verification-activate')}
        />
      ) : null}

      {subStep === 'forgot-password' ? (
        <ForgotPasswordForm onCodeSent={() => setSubStep('verification-otp')} />
      ) : null}

      {subStep === 'verification-otp' ? (
        <VerificationForm mode="checkCode" onCodeVerified={() => setSubStep('reset-password')} />
      ) : null}

      {subStep === 'verification-activate' ? (
        <VerificationForm mode="activateUser" onActivated={onAuthSuccess} />
      ) : null}

      {subStep === 'reset-password' ? (
        <ResetPasswordForm onPasswordChanged={() => setSubStep('sign-in')} />
      ) : null}
    </div>
  );
};

export default ReservationAuthStep;
