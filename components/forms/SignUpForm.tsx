'use client';

import type {
  ISignUpData,
  ISignUpEntity,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';

import { getApi, logInUser, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { normalizePhoneE164, typeError } from '@/components/utils';

import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import SubmitButton from './inputs/FormSubmitButton';

/** SignUpForm — форма регистрации пользователя. */
const SignUpForm = (): JSX.Element => {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, setAction } = useContext(OpenDrawerContext);

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });

  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  // Поля формы по верстке pk_sing_up.html, в порядке верстки.
  const formFields = useMemo(
    () => ['username', 'surname', 'password', 'repeat_password', 'email', 'phone'],
    []
  );

  const canSubmit = useMemo(
    () => formFields.every(field => fields[field]?.valid),
    [fields, formFields]
  );

  const formData = useMemo(
    () =>
      formFields.map(field => ({
        marker: field,
        type: 'string',
        value: fields[field]?.value || '',
      })),
    [fields, formFields]
  );

  const onSignUpHandle = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) return;

      // `formIdentifier` должен совпадать с `formIdentifier` auth-провайдера.
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
        notificationData: (() => {
          const phone = normalizePhoneE164(fields.phone?.value);
          return {
            email: fields.email?.value || '',
            phonePush: phone ? [phone] : [],
            phoneSMS: phone,
          };
        })(),
      };

      setLoading(true);

      try {
        const res = await getApi().AuthProvider.signUp('email', data);

        if (typeError(res)) {
          // Ошибка sign-up — остаёмся в SignUpForm: пользователь не создан, на VerificationForm не переключаемся.
          const err = res as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
        } else {
          const entity = res as ISignUpEntity;
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
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? 'Sign-up failed');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, formData, canSubmit]
  );

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form onSubmit={onSignUpHandle} className="mx-auto flex w-full max-w-100 flex-col gap-5">
        <p className="font-normal text-xl text-white leading-150">
          {t('sign_up_subtitle', 'Sign in or create account to quickly manage order')}
        </p>
        <div className="box-border flex shrink-0 flex-col gap-5">
          {formFields
            .map(marker => data?.attributes.find((f: IFormAttribute) => f.marker === marker))
            .filter((f): f is IFormAttribute => Boolean(f))
            .map((field, index) => (
              <FormInput key={field.marker} index={index} {...field} />
            ))}
        </div>
        <SubmitButton title={t('sign_up_text', '')} isLoading={loading || isLoading} index={10} />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignUpForm;
