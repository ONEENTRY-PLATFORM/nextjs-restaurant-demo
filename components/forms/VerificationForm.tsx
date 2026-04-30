/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';

import { api, logInUser } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import type { FormProps } from '@/app/types/global';
import FormAnimations from '@/components/forms/animations/FormAnimations';

import ErrorMessage from './inputs/ErrorMessage';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * Компонент VerificationForm
 */
const VerificationForm = ({ dict }: FormProps): JSX.Element => {
  const router = useTransitionRouter();
  const dispatch = useAppDispatch();
  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, action } = useContext(OpenDrawerContext);

  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const { receive_otp_text, verify_now_text, resend_text, enter_otp_code } =
    dict;
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  useEffect(() => {
    if (otp) {
      dispatch(addField({ otp_code: { valid: true, value: otp } }));
    }
  }, [otp, dispatch]);

  // Функция для обработки верификации OTP или активации пользователя
  const handleVerification = async () => {
    try {
      if (action !== 'activateUser') {
        // Если action — не активация пользователя, проверяем OTP-код
        const result = await api.AuthProvider.checkCode(
          'email', // Метод верификации через email
          fields.email?.value || '', // Email пользователя из полей формы
          'otp', // Тип кода верификации (One-Time Password)
          otp, // OTP, введённый пользователем
        );
        if (result) setComponent('ResetPasswordForm'); // Переключаемся на Reset Password Form при успехе
      } else {
        // Если action — активация пользователя
        const result = await api.AuthProvider.activateUser(
          'email', // Метод активации через email
          fields.email?.value || '', // Email пользователя из полей формы
          otp, // OTP, введённый пользователем
        );
        if (result) {
          // При успешной активации логиним пользователя
          await logInUser({
            method: 'email', // Метод логина через email
            login: fields.email?.value || '', // Email пользователя для логина
            password: fields.password?.value || '', // Пароль пользователя для логина
          });
          authenticate(); // Вызываем функцию для установки auth-состояния
          router.push('/profile'); // Редирект на страницу профиля пользователя
          setOpen(false); // Закрываем любой открытый модал или drawer
        } else {
          throw new Error('Activation failed'); // Бросаем ошибку при провале активации
        }
      }
    } catch (e: any) {
      // Ловим и устанавливаем любые ошибки, возникшие в процессе
      setError(e.message || 'An error occurred');
    } finally {
      // Гарантируем сброс loading-состояния после обработки
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
    [otp, handleVerification],
  );

  // Функция для обработки переотправки OTP-кода
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onResendHandle = useCallback(async () => {
    try {
      // Включаем loading-состояние
      setLoading(true);
      // Очищаем любые предыдущие сообщения об ошибках
      setError('');
      await api.AuthProvider.generateCode(
        'email', // Метод генерации кода через email
        fields.email?.value || '', // Email пользователя из полей формы
        'generate_code', // Тип action для генерации нового кода
      );
    } catch (e: any) {
      // Ловим и устанавливаем любые ошибки, возникшие в процессе
      setError(e.message || 'An error occurred');
    } finally {
      // Гарантируем сброс loading-состояния после обработки
      setLoading(false);
    }
    // Зависимость useCallback
  }, [fields.email?.value]);

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        className="mx-auto flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
        onSubmit={onSubmitHandle}
      >
        <div className="relative mb-5 box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-paper/60 max-md:max-w-full">
            {(enter_otp_code?.value as string | undefined) ??
              'Enter your OTP code here'}
          </p>
        </div>

        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={(props) => <input {...props} />}
            containerStyle="grid max-w-full grid-cols-6 justify-between gap-2 max-md:gap-2"
            inputStyle="relative box-border flex h-[70px] min-w-[14%] flex-col rounded border border-solid border-paper/30 bg-transparent p-2.5 text-center text-2xl font-medium text-white"
          />
          <div className="self-end text-xs text-brand max-md:mr-2.5">
            <span className="text-paper/60">{receive_otp_text?.value} </span>
            <button
              className="font-bold text-brand"
              type="button"
              onClick={onResendHandle}
            >
              {(resend_text?.value as string | undefined) ?? 'Resend'}
            </button>
          </div>
        </div>

        <FormSubmitButton
          title={verify_now_text?.value}
          isLoading={isLoading}
          index={0}
        />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default VerificationForm;
