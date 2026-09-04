'use client';

import type { IFormAttribute } from 'oneentry/types';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { getApi, isError as isSdkError } from '@/app/api/api/api';
import { useGetFormByMarkerQuery } from '@/app/api/api/RTKApi';
import { useEmailAuthProviderMarker } from '@/app/api/hooks/useAuthProviderMarker';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS } from '@/app/utils/constants';
import { normalizeErrorMessage } from '@/app/utils/errorHandler';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { getFormAttributes } from '@/components/utils';

import Loader from '../shared/Loader';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * ForgotPasswordForm — form for requesting an OTP code to reset the password.
 *
 * @param   {object}     [props]            - Component props.
 * @param   {() => void} [props.onCodeSent] - Optional callback fired after the OTP is generated; replaces the default drawer switch to `VerificationForm` (used by the reservation popup for inline transitions).
 * @returns JSX of the forgot-password form (loader while the form schema is fetched).
 */
export const ForgotPasswordForm = ({
  onCodeSent,
}: {
  onCodeSent?: () => void;
} = {}): JSX.Element => {
  const t = useT();
  const { setComponent, setAction } = useContext(OpenDrawerContext);
  const [isError, setError] = useState<string>('');

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: FORMS.user });
  const emailProviderMarker = useEmailAuthProviderMarker();
  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await getApi().AuthProvider.generateCode(
        emailProviderMarker,
        fields.email?.value || '',
        'generate_otp'
      );
      // The SDK returns an IError envelope instead of throwing — without this check a
      // rejected request would silently advance to the OTP form as if the code was sent.
      if (isSdkError(res)) {
        const err = res as { message?: string | string[]; statusCode?: number };
        setError(normalizeErrorMessage(err.message, t('submit_failed_text', 'Submit failed')));
        // 400 = a still-valid code was already generated — advance to the OTP form anyway.
        if (err.statusCode === 400) {
          setTimeout(() => {
            if (onCodeSent) {
              onCodeSent();
            } else {
              setComponent('VerificationForm');
            }
          }, 800);
        }
        return;
      }
      if (onCodeSent) {
        onCodeSent();
      } else {
        setComponent('VerificationForm');
        setAction('checkCode');
      }
    } catch (error: unknown) {
      // Non-SDK throws only (network/runtime) — SDK errors arrive via the envelope above.
      setError((error as { message?: string })?.message ?? '');
    }
  };

  if (!data || isLoading) {
    return <Loader />;
  }

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        className="mx-auto flex min-h-120 max-w-87.5 flex-col gap-4 text-xl leading-5"
        onSubmit={handleSubmit}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-paper/60 max-md:max-w-full">
            {t(
              'reset_descr',
              'Enter the email address linked to your account and we will send you a one-time code to reset your password.'
            )}
          </p>
        </div>

        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-4">
          {getFormAttributes(data)
            .filter((field: IFormAttribute) => field.marker === 'email')
            .map((field: IFormAttribute, index: number) => (
              <FormInput key={index} index={index} {...field} />
            ))}
        </div>

        <FormSubmitButton title={t('send_text', 'Send code')} isLoading={isLoading} index={10} />
        {isError && <ErrorMessage error={isError} />}
      </form>
    </FormAnimations>
  );
};

export default ForgotPasswordForm;
