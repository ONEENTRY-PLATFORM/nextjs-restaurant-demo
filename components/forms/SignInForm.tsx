'use client';

import type { IFormAttribute } from 'oneentry/types';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { logInUser, useEmailAuthProviderMarker, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS } from '@/app/utils/constants';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import { getFormAttributes } from '@/components/utils';

import { pickAuthMarkers } from './authMarkers';
import CreateAccountButton from './inputs/CreateAccountButton';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';
import ResetPasswordButton from './inputs/ResetPasswordButton';

/**
 * SignInForm — email/password sign-in form.
 *
 * @param   {object}     props                   - Component props.
 * @param   {string}     props.className         - Wrapper class merged onto the animated form root.
 * @param   {boolean}    props.isActive          - Whether the form is the active step in the auth wizard (drives animations).
 * @param   {() => void} [props.onSuccess]       - Optional callback fired on successful sign-in instead of closing the global drawer (used to swap a wizard sub-step inline, e.g. inside the reservation popup).
 * @param   {() => void} [props.onCreateAccount] - Optional override for the "Create account" button (skips the default `setComponent('SignUpForm')` drawer swap).
 * @param   {() => void} [props.onResetPassword] - Optional override for the "Reset password" button (skips the default `setComponent('ForgotPasswordForm')` drawer swap).
 * @returns JSX of the sign-in form.
 */
const SignInForm = ({
  className,
  isActive,
  onSuccess,
  onCreateAccount,
  onResetPassword,
}: {
  className: string;
  isActive: boolean;
  onSuccess?: () => void;
  onCreateAccount?: () => void;
  onResetPassword?: () => void;
}): JSX.Element => {
  const t = useT();
  const { authenticate } = useContext(AuthContext);
  const { setTransition, setComponent, postAuthComponent, setPostAuthComponent } =
    useContext(OpenDrawerContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: FORMS.user });
  const emailProviderMarker = useEmailAuthProviderMarker();

  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  const formFields = useMemo(
    () =>
      getFormAttributes(data).sort(
        (a: { position: number }, b: { position: number }) => a.position - b.position
      ),
    [data]
  );

  // Login/password markers come from the form's `isLogin`/`isPassword` flags, not hard-coded
  // `email`/`password` — a renamed field or a non-email provider keeps working (defaults stay safe).
  const { loginMarker, passwordMarker } = useMemo(() => pickAuthMarkers(formFields), [formFields]);

  const onSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginValue = fields[loginMarker]?.value;
    const passwordValue = fields[passwordMarker]?.value;
    if (!loginValue || !passwordValue) return;

    try {
      setLoading(true);
      const result = await logInUser({
        method: emailProviderMarker,
        login: loginValue,
        password: passwordValue,
        loginMarker,
        passwordMarker,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      authenticate();
      setError('');
      toast(t('signed_in_toast', 'You signed in!'));
      if (onSuccess) {
        onSuccess();
      } else if (postAuthComponent) {
        // Caller (e.g. bottom-menu profile tap) wants to land on a specific drawer after auth.
        setComponent(postAuthComponent);
        setPostAuthComponent('');
      } else {
        // Play the modal outro instead of unmounting instantly — ModalAnimations
        // reverses the entrance timeline and flips `open` on `onReverseComplete`.
        setTransition('close');
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormAnimations isLoading={isLoading || !formFields} className={className} isActive={isActive}>
      <form
        className="relative mx-auto mt-2 mb-6 box-border flex shrink-0 flex-col gap-3"
        onSubmit={onSignIn}
      >
        <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
          {formFields?.map((field: IFormAttribute, index: number) => {
            if (field.isLogin || field.isPassword) {
              return <FormInput key={index} index={index + 2} {...field} />;
            }
            return null;
          })}
        </div>

        <FormSubmitButton index={5} title={t('sign_in_text', '')} isLoading={loading} />

        <FormFieldAnimations index={6} className="mx-auto mb-10 flex justify-between gap-5">
          <div className="w-auto basis-auto text-lg text-paper/60 transition-colors duration-300">
            {t('forgot_password_text', 'Forgot Password?')}
          </div>
          <ResetPasswordButton
            title={t('reset_password_text', 'Reset Password')}
            onClick={onResetPassword}
          />
        </FormFieldAnimations>

        <FormFieldAnimations index={7} className="w-full">
          <CreateAccountButton
            title={t('create_account_text', 'Create account')}
            onClick={onCreateAccount}
          />
        </FormFieldAnimations>

        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignInForm;
