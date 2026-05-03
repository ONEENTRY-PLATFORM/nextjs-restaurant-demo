/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { api } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';

import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';

export const resetPasswordFormFields = [
  {
    fieldType: 'password',
    isVisible: true,
    localizeInfos: { title: 'Password' },
    placeholder: '•••••',
    marker: 'password',
    required: true,
  },
  {
    fieldType: 'password',
    isVisible: true,
    localizeInfos: { title: 'Confirm password' },
    placeholder: '•••••',
    marker: 'password_confirm',
    required: true,
  },
];

/**
 * Форма сброса пароля
 */
const ResetPasswordForm = (): JSX.Element => {
  const t = useT();
  // Деструктурируем значения полей формы из Redux store через селектор
  const { email, password, password_confirm, otp_code } = useAppSelector(
    (state) => state.formFieldsReducer.fields,
  );

  // Получаем функции смены текущего компонента и action из контекста
  const { setComponent, setAction } = useContext(OpenDrawerContext);

  // State для управления статусом загрузки во время асинхронных операций
  const [isLoading, setLoading] = useState(false);

  // State для управления сообщениями об ошибках для отображения пользователю
  const [isError, setError] = useState('');

  /**
   * Меняет пароль через API AuthProvider
   * @param e FormEvent
   */
  const onResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Предотвращаем дефолтное поведение сабмита формы
    e.preventDefault();

    // Включаем loading-состояние на время обработки запроса сброса пароля
    setLoading(true);

    try {
      // Пытаемся сменить пароль пользователя через предоставленный API
      const result = await api.AuthProvider.changePassword(
        'email', // Метод аутентификации (на , 'email', 'google' и т.д.)
        email?.value as string, // Email, введённый пользователем
        'otp', // Тип используемой верификации, здесь OTP (One-Time Password)
        1, // Индикатор версии или типа процесса OTP
        otp_code?.value.toString() || '', // OTP-код, введённый пользователем, конвертированный в строку
        password?.value || '', // Новый пароль, введённый пользователем
        password_confirm?.value || '', // Подтверждение нового пароля
      );

      // Если смена пароля успешна, переключаемся на форму sign-in
      if (result) {
        setComponent('SignInForm');
        setAction('');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        name="resetPasswordForm"
        className="mx-auto flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
        onSubmit={onResetSubmit}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="max-w-full text-xs text-paper/60">
            {t('new_password_desc', 'New password')}
          </p>
        </div>
        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-4">
          {resetPasswordFormFields.map((field, index) => (
            <FormInput
              key={index}
              index={index}
              {...field}
              listTitles={[]}
              position={0}
              type={''}
              validators={{}}
            />
          ))}
        </div>
        <FormSubmitButton
          title={t('change_password_text', 'Change password')}
          isLoading={isLoading}
          index={10}
        />
        {isError && <ErrorMessage error={isError} />}
      </form>
    </FormAnimations>
  );
};

export default ResetPasswordForm;
