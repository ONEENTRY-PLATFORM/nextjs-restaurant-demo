/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import OtpInput from 'react-otp-input';

import { getApi, logInUser, useGetAuthProvidersQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { typeError } from '@/components/utils';

import ErrorMessage from './inputs/ErrorMessage';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * Компонент VerificationForm — ввод 6-значного OTP-кода.
 *
 * ⚠️ Намеренно фронтовая форма (OTP-input, не из CMS). В админке OneEntry
 * соответствующей формы нет — код отправляется в SDK `AuthProvider.checkCode(...)`
 * (или `activateUser(...)` если идёт активация после регистрации). MCP-правило
 * «Forms ALWAYS dynamic» сюда не применимо — это auth-flow метод с фиксированной
 * сигнатурой SDK. См. MISMATCH-LOG §C.8.2.
 */
const VerificationForm = (): JSX.Element => {
  const t = useT();
  const router = useTransitionRouter();
  const dispatch = useAppDispatch();
  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, action } = useContext(OpenDrawerContext);

  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // Cooldown между отправками OTP.
  const { data: providers } = useGetAuthProvidersQuery('');
  const ttl =
    Number(providers?.find(p => p.identifier === 'email')?.config?.systemCodeTlsSec) || 60;
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

  // Функция для обработки верификации OTP или активации пользователя.
  const handleVerification = async () => {
    try {
      if (action !== 'activateUser') {
        const result = await getApi().AuthProvider.checkCode(
          'email',
          fields.email?.value || '',
          'otp',
          otp
        );
        if (typeError(result)) {
          const err = result as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
          return;
        }
        if (!result) {
          setError('Invalid code');
          return;
        }
        setComponent('ResetPasswordForm');
      } else {
        const result = await getApi().AuthProvider.activateUser(
          'email',
          fields.email?.value || '',
          otp
        );
        if (typeError(result)) {
          const err = result as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
          return;
        }
        if (!result) {
          setError('Activation failed');
          return;
        }
        // Активация успешна — логинимся и закрываем попап
        await logInUser({
          method: 'email',
          login: fields.email?.value || '',
          password: fields.password?.value || '',
        });
        authenticate();
        router.push('/profile');
        setOpen(false);
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Функция для обработки сабмита формы
  const onSubmitHandle = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      // Предотвращаем дефолтное поведение сабмита формы
      e.preventDefault();

      // Проверяем валидность длины OTP
      if (otp.length === 6) {
        // Включаем loading-состояние
        setLoading(true);
        // Очищаем любые предыдущие сообщения об ошибках
        setError('');
        // Вызываем обработчик верификации
        await handleVerification();
      }
    },
    // Зависимости useCallback
    [otp, handleVerification]
  );

  // Переотправка OTP-кода.
  const onResendHandle = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      setLoading(true);
      setError('');
      const result = await getApi().AuthProvider.generateCode(
        'email',
        fields.email?.value || '',
        'generate_code'
      );
      if (typeError(result)) {
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
  }, [fields.email, cooldown, ttl]);

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
