/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type {
  ISignUpData,
  ISignUpEntity,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IAttributes } from 'oneentry/dist/base/utils';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';

import { api, logInUser, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import type { FormProps } from '@/app/types/global';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { typeError } from '@/components/utils';

import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import SubmitButton from './inputs/FormSubmitButton';

/**
 * Форма SignUp
 * @param dict - объект с локализованными текстами
 * @param className - классы для стилизации
 */
const SignUpForm = ({ dict }: FormProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, setAction } = useContext(OpenDrawerContext);

  const { sign_up_text, sign_in_text, create_account_text } = dict;

  // Получаем форму по маркеру через RTK
  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });

  // Получаем поля из formFieldsReducer
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  // Мемоизированные поля формы для лучшей производительности
  const formFields = useMemo(
    () => [
      'username',
      'surname',
      'email',
      'phone',
      'password',
      'repeat_password',
    ],
    [],
  );

  // Проверяем, может ли пользователь засабмитить форму
  const canSubmit = useMemo(
    () => formFields.every((field) => fields[field]?.valid),
    [fields, formFields],
  );

  // Готовим formData
  const formData = useMemo(
    () =>
      formFields.map((field) => ({
        marker: field,
        type: 'string',
        value: fields[field]?.value || '',
      })),
    [fields, formFields],
  );

  // Обработчик sign up
  const onSignUpHandle = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) return;

      // Готовим объект data для запроса sign-up.
      // `formIdentifier` должен совпадать с `formIdentifier` auth-провайдера
      const data: ISignUpData = {
        formIdentifier: 'user',
        authData: [
          {
            marker: 'email',
            value: fields.email?.value || '',
          },
          {
            marker: 'password',
            value: fields.password?.value || '',
          },
        ],
        formData,
        notificationData: {
          email: fields.email?.value || '',
          phonePush: [fields.phone?.value || ''],
          phoneSMS: fields.phone?.value || '',
        },
      };

      setLoading(true);

      try {
        // Пытаемся зарегистрировать пользователя через предоставленный API
        const res = await api.AuthProvider.signUp('email', data);

        if (typeError(res)) {
          // Открываем форму Verification для активации пользователя
          setOpen(true);
          setComponent('VerificationForm');
          setAction('activateUser');
          setError(
            `Error ${(res as { statusCode?: number }).statusCode ?? ''}`,
          );
        } else {
          const entity = res as ISignUpEntity;
          // Если ответ говорит, что аккаунт активен, логиним пользователя
          if (entity.isActive) {
            await logInUser({
              method: 'email',
              login: entity.identifier,
              password: fields.password?.value || '',
            });
            authenticate();
            setOpen(false);
          } else {
            setOpen(true);
            setComponent('VerificationForm');
            setAction('activateUser');
          }
          setError('');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, formData, canSubmit],
  );

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        onSubmit={onSignUpHandle}
        className="mx-auto flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-paper/60 max-md:max-w-full">
            <button
              onClick={() => setComponent('SignInForm')}
              className="underline"
            >
              {(sign_in_text?.value as string) || 'Sign in'}
            </button>{' '}
            {(create_account_text?.value as string) || 'Create account'}
          </p>
        </div>

        <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
          {data?.attributes.map(
            (field: IFormAttribute, index: number) =>
              field.marker !== 'email_notification_reg' && (
                <FormInput
                  key={index}
                  index={index}
                  {...(field as unknown as IAttributes)}
                />
              ),
          )}
        </div>
        <SubmitButton
          title={(sign_up_text?.value as string) ?? ''}
          isLoading={loading || isLoading}
          index={10}
        />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignUpForm;
