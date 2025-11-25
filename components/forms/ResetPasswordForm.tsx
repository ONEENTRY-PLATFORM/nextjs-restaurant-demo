/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { FC, FormEvent } from 'react';
import { useContext, useState } from 'react';

import { api } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import type { FormProps } from '@/app/types/global';
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
    marker: 'password_reg',
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
 * Reset password form
 * @param dict dictionary from server api
 * @returns Reset password form
 */
const ResetPasswordForm: FC<FormProps> = ({ dict }) => {
  // Destructure form field values from the Redux store using a selector
  const { email, password, password_confirm, otp_code } = useAppSelector(
    (state) => state.formFieldsReducer.fields,
  );

  // Access functions to change the current component and action from context
  const { setComponent, setAction } = useContext(OpenDrawerContext);

  // State to manage loading status during asynchronous operations
  const [isLoading, setLoading] = useState(false);

  // State to manage error messages for display to the user
  const [isError, setError] = useState('');

  // Destructure text strings from a dictionary object for localization or static text
  const { new_password_desc, change_password_text } = dict;

  /**
   * Change password with API AuthProvider
   * @param e FormEvent
   */
  const onResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Prevent the default form submission behavior
    e.preventDefault();

    // Set loading state to true while processing the password reset request
    setLoading(true);

    try {
      // Attempt to change the user's password using the provided API
      const result = await api.AuthProvider.changePassword(
        'email', // The method of authentication, in this case via email
        email?.value || '', // User's email address
        'otp', // The type of verification used, here it's an OTP (One-Time Password)
        1, // Version or type indicator for the OTP process
        otp_code?.value.toString() || '', // The OTP code entered by the user, converted to a string
        password?.value || '', // New password entered by the user
        password_confirm?.value || '', // Confirmation of the new password
      );
      console.log(result);

      if (result) {
        // If the password change is successful, switch to the sign-in form
        setComponent('SignInForm');
        setAction(''); // Clear any previous actions
      }
    } catch (error: any) {
      // Catch any errors and set the error message
      setError(error.message);
    } finally {
      // Reset loading state after processing the password reset request
      setLoading(false);
    }
  };

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        name="resetPasswordForm"
        className="mx-auto flex min-h-full w-full max-w-[430px] flex-col gap-4 text-xl leading-5"
        onSubmit={onResetSubmit}
      >
        <div className="relative box-border flex shrink-0 flex-col gap-2.5">
          <p className="max-w-full text-xs text-gray-400">
            {new_password_desc?.value || 'New password'}
          </p>
        </div>
        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-4">
          {resetPasswordFormFields.map((field, index) => (
            <FormInput
              key={index}
              index={index}
              {...field}
              listTitles={[]}
              position={0}
              type={''}
              validators={{}}
            />
          ))}
        </div>
        <FormSubmitButton
          title={change_password_text?.value || 'Change password'}
          isLoading={isLoading}
          index={10}
        />
        {isError && <ErrorMessage error={isError} />}
      </form>
    </FormAnimations>
  );
};

export default ResetPasswordForm;
