'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';

import { getApi, isError, useEmailAuthProviderMarker, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS } from '@/app/utils/constants';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { getFormAttributes } from '@/components/utils';

import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * ResetPasswordForm — OTP-based password reset form.
 *
 * @param   {object}     [props]                   - Component props.
 * @param   {() => void} [props.onPasswordChanged] - Optional callback fired after a successful change; replaces the default drawer switch back to `SignInForm` (used by the reservation popup for inline transitions).
 * @returns JSX of the OTP-based reset-password form.
 */
const ResetPasswordForm = ({
  onPasswordChanged,
}: {
  onPasswordChanged?: () => void;
} = {}): JSX.Element => {
  const t = useT();
  const { email, password, repeat_password, otp_code } = useAppSelector(
    state => state.formFieldsReducer.fields
  );

  const { setComponent, setAction } = useContext(OpenDrawerContext);
  const emailProviderMarker = useEmailAuthProviderMarker();
  const { data, isLoading: isFormLoading } = useGetFormByMarkerQuery({ marker: FORMS.user });

  const passwordFields = useMemo(
    () =>
      getFormAttributes(data)
        .filter((f: IFormAttribute) => f.marker === 'password' || f.marker === 'repeat_password')
        .sort((a: IFormAttribute, b: IFormAttribute) => (a.position ?? 0) - (b.position ?? 0)),
    [data]
  );

  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setError] = useState('');

  const onResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await getApi().AuthProvider.changePassword(
        emailProviderMarker,
        email?.value as string,
        'otp',
        1,
        otp_code?.value.toString() || '',
        password?.value || '',
        repeat_password?.value || ''
      );

      // The SDK returns an IError envelope (it does not throw) on failure — and an IError object
      // is truthy, so the previous `if (result)` reported failed changes as success. Guard explicitly.
      if (isError(result)) {
        setError(Array.isArray(result.message) ? result.message.join('; ') : result.message);
        return;
      }

      if (onPasswordChanged) {
        onPasswordChanged();
      } else {
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
    <FormAnimations className={''} isLoading={isFormLoading} isActive={true}>
      <form
        name="resetPasswordForm"
        className="mx-auto flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5"
        onSubmit={onResetSubmit}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="max-w-full text-xs text-paper/60">
            {t('new_password_label', 'New password')}
          </p>
        </div>
        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-4">
          {passwordFields.map((field, index) => (
            <FormInput key={field.marker} index={index} {...field} />
          ))}
        </div>
        <FormSubmitButton
          title={t('change_password_button', 'Change password')}
          isLoading={isLoading || isFormLoading}
          index={10}
        />
        {errorMessage && <ErrorMessage error={errorMessage} />}
      </form>
    </FormAnimations>
  );
};

export default ResetPasswordForm;
