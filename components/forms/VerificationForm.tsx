'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { FormEvent, JSX } from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import OtpInput from 'react-otp-input';

import { getApi, isError } from '@/app/api/api/api';
import { useGetAuthProvidersQuery } from '@/app/api/api/RTKApi';
import { logInUser } from '@/app/api/client/logInUser';
import { useEmailAuthProviderMarker } from '@/app/api/hooks/useAuthProviderMarker';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { findEmailLikeProvider } from '@/components/forms/authProviders';

import ErrorMessage from './inputs/ErrorMessage';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * VerificationForm — 6-digit OTP code entry.
 *
 * @param   {object}     [props]                - Component props.
 * @param   {'activateUser' | 'checkCode'} [props.mode] - Optional mode override that takes precedence over `OpenDrawerContext.action` (used when rendered outside the drawer, e.g. inline in the reservation popup).
 * @param   {() => void} [props.onCodeVerified] - Optional callback fired after a successful `checkCode` (replaces the default drawer switch to `ResetPasswordForm`).
 * @param   {() => void} [props.onActivated]    - Optional callback fired after a successful `activateUser` + login (replaces `router.push('/profile')` + `setOpen(false)`).
 * @returns JSX of the 6-digit OTP entry form.
 */
const VerificationForm = ({
  mode,
  onCodeVerified,
  onActivated,
}: {
  mode?: 'activateUser' | 'checkCode';
  onCodeVerified?: () => void;
  onActivated?: () => void;
} = {}): JSX.Element => {
  const t = useT();
  const router = useTransitionRouter();
  const dispatch = useAppDispatch();
  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, action, postAuthComponent, setPostAuthComponent } =
    useContext(OpenDrawerContext);
  const effectiveAction = mode ?? action;

  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // Cooldown between OTP resends.
  const { data: providers } = useGetAuthProvidersQuery('');
  const emailProviderMarker = useEmailAuthProviderMarker();
  const ttl = Number(findEmailLikeProvider(providers ?? [])?.config?.systemCodeTlsSec) || 60;
  const [cooldown, setCooldown] = useState(60);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && providers) {
      initializedRef.current = true;
      setCooldown(ttl);
    }
  }, [providers, ttl]);

  useEffect(() => {
    const id = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  useEffect(() => {
    if (otp) {
      dispatch(addField({ otp_code: { valid: true, value: otp } }));
    }
  }, [otp, dispatch]);

  const handleVerification = async () => {
    try {
      if (effectiveAction !== 'activateUser') {
        const result = await getApi().AuthProvider.checkCode(
          emailProviderMarker,
          fields.email?.value || '',
          'otp',
          otp
        );
        if (isError(result)) {
          const err = result as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
          return;
        }
        if (!result) {
          setError('Invalid code');
          return;
        }
        if (onCodeVerified) {
          onCodeVerified();
        } else {
          setComponent('ResetPasswordForm');
        }
      } else {
        const result = await getApi().AuthProvider.activateUser(
          emailProviderMarker,
          fields.email?.value || '',
          otp
        );
        if (isError(result)) {
          const err = result as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
          return;
        }
        if (!result) {
          setError('Activation failed');
          return;
        }
        // Activation succeeded — sign the user in and close the popup.
        await logInUser({
          method: emailProviderMarker,
          login: fields.email?.value || '',
          password: fields.password?.value || '',
        });
        authenticate();
        if (onActivated) {
          onActivated();
        } else if (postAuthComponent) {
          // Caller (e.g. bottom-menu profile tap) wants to land on a specific drawer after auth.
          setComponent(postAuthComponent);
          setPostAuthComponent('');
        } else {
          router.push('/profile');
          setOpen(false);
        }
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitHandle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length === 6) {
      setLoading(true);
      setError('');
      await handleVerification();
    }
  };

  // Resend the OTP code.
  const onResendHandle = async () => {
    if (cooldown > 0) return;
    try {
      setLoading(true);
      setError('');
      const result = await getApi().AuthProvider.generateCode(
        emailProviderMarker,
        fields.email?.value || '',
        'generate_code'
      );
      if (isError(result)) {
        const err = result as { statusCode?: number; message?: string };
        setError(err.message || `Error ${err.statusCode ?? ''}`);
      } else {
        setCooldown(ttl);
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        className="mx-auto flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
        onSubmit={onSubmitHandle}
      >
        <div className="relative mb-5 box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-paper/60 max-md:max-w-full">
            {t('enter_otp_code', 'Enter your OTP code here')}
          </p>
        </div>

        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={props => <input {...props} />}
            containerStyle="grid max-w-full grid-cols-6 justify-between gap-2 max-md:gap-2"
            inputStyle="relative box-border flex h-[70px] min-w-[14%] flex-col rounded border border-solid border-paper/30 bg-transparent p-2.5 text-center text-2xl font-medium text-white"
          />
          <div className="self-end text-xs text-brand max-md:mr-2.5">
            <span className="text-paper/60">{t('receive_otp_text', '')} </span>
            <button
              className="font-bold text-brand disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={onResendHandle}
              disabled={cooldown > 0 || isLoading}
            >
              {t('resend_text', 'Resend')}
              {cooldown > 0 ? ` (${cooldown}s)` : ''}
            </button>
          </div>
        </div>

        <FormSubmitButton title={t('verify_now_text', '')} isLoading={isLoading} index={0} />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default VerificationForm;
