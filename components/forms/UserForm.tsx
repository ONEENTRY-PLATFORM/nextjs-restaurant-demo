/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { IAuthFormData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IAttributes } from 'oneentry/dist/base/utils';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { api, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import type { FormProps } from '@/app/types/global';
import { dictText } from '@/components/utils';

// import AuthError from '../pages/AuthError';
import SpinnerLoader from '../shared/SpinnerLoader';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import SubmitButton from './inputs/FormSubmitButton';

export type InputValue = {
  value: string;
  valid: boolean;
  [key: string]: unknown;
};

/**
 * Форма User
 * @param dict - объект с текстами для локализации
 */
const UserForm = ({ dict }: FormProps): JSX.Element => {
  const { isAuth, refreshUser, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [isError, setError] = useState('');

  // Получаем форму по маркеру через RTK
  const { data, isLoading, error } = useGetFormByMarkerQuery({
    marker: 'user',
  });

  // получаем поля из formFieldsReducer
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  const formData = useMemo(() => {
    return data?.attributes
      .map((field: IFormAttribute) => {
        if (field.marker !== 'email_notification_reg') {
          return {
            marker: field.marker,
            value: fields[field.marker as keyof typeof fields]?.value || '',
            type: 'string',
          };
        }
        return undefined;
      })
      .filter(Boolean) as IAuthFormData[];
  }, [data?.attributes, fields]);

  // Обновляем данные пользователя
  /* eslint-disable react-hooks/preserve-manual-memoization */
  const onUpdateUserData = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        setLoading(true);

        if (user?.formIdentifier) {
          await api.Users.updateUser({
            formIdentifier: user.formIdentifier,
            formData,
            authData: [
              {
                marker: 'password',
                value: fields['password']?.value || '',
              },
            ],
            notificationData: {
              email: fields['email']?.value || '',
              phonePush: [],
              phoneSMS: fields['phone']?.value || '',
            },
            state: {},
          });
        }

        refreshUser();
        setError('');
        toast('Data saved!');
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [fields, formData, refreshUser, user?.formIdentifier],
  );

  if (isLoading) {
    return <SpinnerLoader />;
  }

  if (!isAuth || error || !user?.formData) {
    // return <AuthError dict={dict} />;
  }

  return (
    <form
      className="flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
      onSubmit={onUpdateUserData}
    >
      <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
        {data?.attributes
          .filter(
            (field: { marker: string }) =>
              field.marker !== 'email_notification_reg',
          )
          .map((field: IFormAttribute, index: number) => {
            const fieldData =
              Array.isArray(user?.formData) &&
              (user.formData.find(
                (item) => item.marker === field.marker,
              ) as unknown as FormDataType[]);
            return (
              <FormInput
                key={index}
                index={index}
                {...(field as unknown as IAttributes)}
                {...fieldData}
              />
            );
          })}
      </div>
      <SubmitButton
        title={dictText(dict, 'submit_text', '')}
        isLoading={loading}
        index={10}
      />
      {isError && <ErrorMessage error={isError} />}
    </form>
  );
};

export default UserForm;
