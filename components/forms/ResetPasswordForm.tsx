'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { getApi } from '@/app/api';
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
 * ResetPasswordForm — форма сброса пароля через OTP.
 *
 * Намеренно статические `<input>`-поля (не `getFormByMarker` из CMS) — данные
 * напрямую идут в SDK `AuthProvider.changePassword(...)`. См. MISMATCH-LOG §C.8.2.
 */
const ResetPasswordForm = (): JSX.Element => {
  const t = useT();
  const { email, password, password_confirm, otp_code } = useAppSelector(
    state => state.formFieldsReducer.fields
  );

  const { setComponent, setAction } = useContext(OpenDrawerContext);

  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState('');

  const onResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await getApi().AuthProvider.changePassword(
        'email',
        email?.value as string,
        'otp',
        1,
        otp_code?.value.toString() || '',
        password?.value || '',
        password_confirm?.value || ''
      );

      if (result) {
        setComponent('SignInForm');
        setAction('');
      }
    } catch (error: unknown) {
      setError((error as { message?: string })?.message ?? '');
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
              {...(field as unknown as IFormAttribute)}
              listTitles={[]}
              position={0}
              type={'string'}
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
