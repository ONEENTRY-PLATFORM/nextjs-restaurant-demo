'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { getApi, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';

import SpinnerLoader from '../shared/SpinnerLoader';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * ForgotPasswordForm — form for requesting an OTP code to reset the password.
 *
 * @returns JSX of the forgot-password form (loader while the form schema is fetched).
 */
export const ForgotPasswordForm = (): JSX.Element => {
  const t = useT();
  const { setComponent, setAction } = useContext(OpenDrawerContext);
  const [isError, setError] = useState<string>('');

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });
  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await getApi().AuthProvider.generateCode('email', fields.email?.value || '', 'generate_otp');
      setComponent('VerificationForm');
      setAction('checkCode');
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      setError(err?.message ?? '');
      if (err?.statusCode === 400) {
        setTimeout(() => {
          setComponent('VerificationForm');
        }, 800);
      }
    }
  };

  if (!data || isLoading) {
    return <SpinnerLoader />;
  }

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        className="mx-auto flex min-h-120 max-w-87.5 flex-col gap-4 text-xl leading-5"
        onSubmit={handleSubmit}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-paper/60 max-md:max-w-full">{t('reset_descr', '')}</p>
        </div>

        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-4">
          {data.attributes
            .filter((field: IFormAttribute) => field.marker === 'email')
            .map((field: IFormAttribute, index: number) => (
              <FormInput key={index} index={index} {...field} />
            ))}
        </div>

        <FormSubmitButton title={t('send_text', '')} isLoading={isLoading} index={10} />
        {isError && <ErrorMessage error={isError} />}
      </form>
    </FormAnimations>
  );
};

export default ForgotPasswordForm;
