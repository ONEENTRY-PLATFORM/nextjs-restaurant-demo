/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { logInUser, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';

import CreateAccountButton from './inputs/CreateAccountButton';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';
import ResetPasswordButton from './inputs/ResetPasswordButton';

/**
 * Форма SignIn
 * @param {object} props - объект со свойствами компонента.
 * @param {string} props.className - строка с именами классов для стилизации.
 * @param {boolean} props.isActive - флаг, указывающий на активность формы.
 */
const SignInForm = ({
  dict,
  className,
  isActive,
}: {
  dict: IAttributeValues;
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const { authenticate } = useContext(AuthContext);
  const { setOpen } = useContext(OpenDrawerContext);

  const [tab, setTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    reset_password_text,
    forgot_password_text,
    create_account_text,
    sign_in_text,
  } = dict;

  // Получаем форму по маркеру через RTK
  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });

  // Получаем поля из formFieldsReducer
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  // сортируем поля по position
  const formFields = useMemo(
    () =>
      data?.attributes
        .slice()
        .sort(
          (a: { position: number }, b: { position: number }) =>
            a.position - b.position,
        ),
    [data],
  );

  // SignIn через API AuthProvider
  const onSignIn = async (e: FormEvent<HTMLFormElement>) => {
    // Предотвращаем дефолтное поведение сабмита формы
    e.preventDefault();

    // Проверяем, заполнены ли поля email и password, иначе выходим
    if (!fields.email || !fields.password) return;

    try {
      // Включаем loading-состояние на время обработки запроса sign-in
      setLoading(true);

      // Пытаемся залогинить пользователя с предоставленными credentials
      const result = await logInUser({
        method: 'email', // Метод аутентификации (например, 'email', 'google' и т.д.)
        login: fields.email.value, // Email пользователя
        password: fields.password.value, // Пароль пользователя
      });

      // Если в результате есть ошибка, бросаем её, чтобы поймать ниже
      if (result?.error) {
        throw new Error(result.error);
      }

      // Закрываем любые открытые модалки или формы при успешном sign-in
      setOpen(false);
      authenticate(); // Аутентифицируем сессию пользователя
      setError(''); // Очищаем любые предыдущие ошибки
      toast('You signed in!'); // Показываем сообщение об успехе пользователю
    } catch (err: any) {
      // Ловим любые ошибки и устанавливаем сообщение об ошибке
      setError(err.message);
    } finally {
      // Сбрасываем loading-состояние после обработки запроса sign-in
      setLoading(false);
    }
  };

  return (
    <FormAnimations
      isLoading={isLoading || !formFields}
      className={className}
      isActive={isActive}
    >
      <form
        className="relative mx-auto mb-6 mt-2 box-border flex shrink-0 flex-col gap-3"
        onSubmit={onSignIn}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <FormFieldAnimations
            index={1}
            className="max-w-full text-xs text-paper/60"
          >
            {['email', 'phone'].map((type) => (
              <button
                key={type}
                onClick={() => setTab(type)}
                className={tab === type ? 'font-bold' : ''}
              >
                {type}
              </button>
            ))}
          </FormFieldAnimations>
        </div>

        <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
          {formFields?.map((field: any, index: number) => {
            if (field.marker === `${tab}` || field.marker === 'password') {
              return <FormInput key={index} index={index + 2} {...field} />;
            }
            return null;
          })}
        </div>

        <FormSubmitButton
          index={5}
          title={(sign_in_text?.value as string) ?? ''}
          isLoading={loading}
        />

        <FormFieldAnimations
          index={6}
          className="mx-auto mb-10 flex justify-between gap-5"
        >
          <div className="w-auto basis-auto text-lg text-paper/60 transition-colors duration-300">
            {(forgot_password_text?.value as string) || 'Forgot Password?'}
          </div>
          <ResetPasswordButton
            title={(reset_password_text?.value as string) || 'Reset Password'}
          />
        </FormFieldAnimations>

        <FormFieldAnimations index={7} className="w-full">
          <CreateAccountButton
            title={(create_account_text?.value as string) || 'Create account'}
          />
        </FormFieldAnimations>

        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignInForm;
