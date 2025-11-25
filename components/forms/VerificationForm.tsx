/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';

import { api, logInUser } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import type { FormProps } from '@/app/types/global';
import FormAnimations from '@/components/forms/animations/FormAnimations';

import ErrorMessage from './inputs/ErrorMessage';
import FormSubmitButton from './inputs/FormSubmitButton';

/**
 * VerificationForm component
 * @param dict - Dictionary from server API
 */
const VerificationForm = ({ dict }: FormProps): JSX.Element => {
  const router = useTransitionRouter();
  const dispatch = useAppDispatch();
  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, action } = useContext(OpenDrawerContext);

  const [isLoading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const { receive_otp_text, verify_now_text } = dict;
  const fields = useAppSelector((state) => state.formFieldsReducer.fields);

  useEffect(() => {
    if (otp) {
      dispatch(addField({ otp_code: { valid: true, value: otp } }));
    }
  }, [otp, dispatch]);

  // Function to handle verification of the OTP or activation of the user
  const handleVerification = async () => {
    try {
      if (action !== 'activateUser') {
        // If the action is not to activate a user, check the OTP code
        const result = await api.AuthProvider.checkCode(
          'email', // Method of verification via email
          fields.email_reg?.value || '', // User's email address from form fields
          'otp', // Type of verification code (One-Time Password)
          otp, // The OTP entered by the user
        );
        if (result) setComponent('ResetPasswordForm'); // Switch to Reset Password Form on success
      } else {
        // If the action is to activate a user
        const result = await api.AuthProvider.activateUser(
          'email', // Activation method via email
          fields.email_reg?.value || '', // User's email address from form fields
          otp, // The OTP entered by the user
        );
        if (result) {
          // On successful activation, log in the user
          await logInUser({
            method: 'email', // Login method via email
            login: fields.email_reg?.value || '', // User's email for login
            password: fields.password_reg?.value || '', // User's password for login
          });
          authenticate(); // Call function to set authentication state
          router.push('/profile'); // Redirect to the user's profile page
          setOpen(false); // Close any open modal or drawer
        } else {
          throw new Error('Activation failed'); // Throw an error if activation fails
        }
      }
    } catch (e: any) {
      // Catch and set any errors encountered during the process
      setError(e.message || 'An error occurred');
    } finally {
      // Ensure loading state is reset after processing
      setLoading(false);
    }
  };

  // Function to handle form submission
  const onSubmitHandle = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      // Prevent default form submission behavior
      e.preventDefault();

      // Check if the OTP length is valid
      if (otp.length === 6) {
        // Set loading state to true
        setLoading(true);
        // Clear any previous error messages
        setError('');
        // Call verification handler
        await handleVerification();
      }
    },
    // Dependencies for useCallback
    [otp, handleVerification],
  );

  // Function to handle resending of the OTP code
  const onResendHandle = useCallback(async () => {
    try {
      // Set loading state to true
      setLoading(true);
      // Clear any previous error messages
      setError('');
      await api.AuthProvider.generateCode(
        'email', // Method to generate code via email
        fields.email_reg?.value || '', // User's email address from form fields
        'generate_code', // Action type to generate a new code
      );
    } catch (e: any) {
      // Catch and set any errors encountered during the process
      setError(e.message || 'An error occurred');
    } finally {
      // Ensure loading state is reset after processing
      setLoading(false);
    }
    // Dependency for useCallback
  }, [fields.email_reg?.value]);

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form
        className="mx-auto flex min-h-full w-full max-w-[430px] flex-col gap-4 text-xl leading-5"
        onSubmit={onSubmitHandle}
      >
        <div className="relative mb-5 box-border flex shrink-0 flex-col gap-2.5">
          <p className="text-xs text-gray-400 max-md:max-w-full">
            Enter your OTP code here
          </p>
        </div>

        <div className="relative mb-8 box-border flex shrink-0 flex-col gap-6">
          <OtpInput
            value={otp}
            onChange={setOtp}
            numInputs={6}
            renderInput={(props) => <input {...props} />}
            containerStyle="grid max-w-full grid-cols-6 justify-between gap-2 max-md:gap-2"
            inputStyle="relative box-border flex h-[70px] min-w-[14%] flex-col rounded border border-solid border-neutral-100 bg-neutral-100 p-2.5 text-center text-2xl font-medium text-neutral-600"
          />
          <div className="self-end text-xs text-fuchsia-500 max-md:mr-2.5">
            <span className="text-gray-400">{receive_otp_text?.value} </span>
            <button
              className="font-bold text-fuchsia-500"
              type="button"
              onClick={onResendHandle}
            >
              Resend
            </button>
          </div>
        </div>

        <FormSubmitButton
          title={verify_now_text?.value}
          isLoading={isLoading}
          index={0}
        />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default VerificationForm;
