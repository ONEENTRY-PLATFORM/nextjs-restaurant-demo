'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { logInUser, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';

import CreateAccountButton from './inputs/CreateAccountButton';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';
import ResetPasswordButton from './inputs/ResetPasswordButton';

/**
 * SignInForm — email/password sign-in form.
 *
 * @param   {object}  props           - Component props.
 * @param   {string}  props.className - Wrapper class merged onto the animated form root.
 * @param   {boolean} props.isActive  - Whether the form is the active step in the auth wizard (drives animations).
 * @returns {JSX.Element}               JSX of the sign-in form.
 */
const SignInForm = ({
  className,
  isActive,
}: {
  className: string;
  isActive: boolean;
}): JSX.Element => {
  const t = useT();
  const { authenticate } = useContext(AuthContext);
  const { setOpen } = useContext(OpenDrawerContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });

  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  const formFields = useMemo(
    () =>
      data?.attributes
        .slice()
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position),
    [data]
  );

  const onSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fields.email || !fields.password) return;

    try {
      setLoading(true);
      const result = await logInUser({
        method: 'email',
        login: fields.email.value,
        password: fields.password.value,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setOpen(false);
      authenticate();
      setError('');
      toast('You signed in!');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormAnimations isLoading={isLoading || !formFields} className={className} isActive={isActive}>
      <form
        className="relative mx-auto mb-6 mt-2 box-border flex shrink-0 flex-col gap-3"
        onSubmit={onSignIn}
      >
        <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
          {formFields?.map((field: IFormAttribute, index: number) => {
            if (field.marker === 'email' || field.marker === 'password') {
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
          <ResetPasswordButton title={t('reset_password_text', 'Reset Password')} />
        </FormFieldAnimations>

        <FormFieldAnimations index={7} className="w-full">
          <CreateAccountButton title={t('create_account_text', 'Create account')} />
        </FormFieldAnimations>

        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignInForm;
