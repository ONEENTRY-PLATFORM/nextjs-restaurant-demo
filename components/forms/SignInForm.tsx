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
 * SignIn form
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

  // Get form by marker with RTK
  const { data, isLoading } = useGetFormByMarkerQuery({ marker: 'user' });

  // Get fields from formFieldsReducer
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  // sort fields by position
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

  // SignIn with API AuthProvider
  const onSignIn = async (e: FormEvent<HTMLFormElement>) => {
    // Prevent the default form submission behavior
    e.preventDefault();

    // Check if email and password fields are filled, exit early if not
    if (!fields.email || !fields.password) return;

    try {
      // Set loading state to true while processing the sign-in request
      setLoading(true);

      // Attempt to log in the user with the provided credentials
      const result = await logInUser({
        method: 'email', // Authentication method (e.g., 'email', 'google', etc.)
        login: fields.email.value, // User's email
        password: fields.password.value, // User's password
      });

      // If there's an error in the result, throw an error to be caught below
      if (result?.error) {
        throw new Error(result.error);
      }

      // Close any open modals or forms upon successful sign-in
      setOpen(false);
      authenticate(); // Authenticate the user session
      setError(''); // Clear any previous errors
      toast('You signed in!'); // Display a success message to the user
    } catch (err: any) {
      // Catch any errors and set the error message
      setError(err.message);
    } finally {
      // Reset loading state after processing the sign-in request
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
            className="max-w-full text-xs text-gray-400"
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
          title={sign_in_text?.value}
          isLoading={loading}
        />

        <FormFieldAnimations
          index={6}
          className="mx-auto mb-10 flex justify-between gap-5"
        >
          <div className="w-auto basis-auto text-lg text-gray-400 transition-colors duration-300">
            {forgot_password_text?.value || 'Forgot Password?'}
          </div>
          <ResetPasswordButton
            title={reset_password_text?.value || 'Reset Password'}
          />
        </FormFieldAnimations>

        <FormFieldAnimations index={7} className="w-full">
          <CreateAccountButton
            title={create_account_text?.value || 'Create account'}
          />
        </FormFieldAnimations>

        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignInForm;
