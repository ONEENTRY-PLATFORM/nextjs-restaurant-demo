'use client';

import type {
  ISignUpData,
  ISignUpEntity,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';

import {
  getApi,
  isError,
  logInUser,
  useEmailAuthProviderMarker,
  useGetFormByMarkerQuery,
} from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS } from '@/app/utils/constants';
import FormAnimations from '@/components/forms/animations/FormAnimations';
import { normalizePhoneE164 } from '@/components/utils';

import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import SubmitButton from './inputs/FormSubmitButton';

/**
 * SignUpForm — user sign-up form (email/phone + password) driven by the OneEntry `user` form schema.
 *
 * @param   {object}     [props]                  - Component props.
 * @param   {() => void} [props.onSuccess]        - Optional callback fired after an active-user sign-up + login (replaces `setOpen(false)`; used by the reservation popup to advance its wizard inline).
 * @param   {() => void} [props.onNeedActivation] - Optional callback fired when the new user is inactive (replaces the default switch to `VerificationForm` in the drawer).
 * @returns JSX of the sign-up form, including transition into VerificationForm on inactive users.
 */
const SignUpForm = ({
  onSuccess,
  onNeedActivation,
}: {
  onSuccess?: () => void;
  onNeedActivation?: () => void;
} = {}): JSX.Element => {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { authenticate } = useContext(AuthContext);
  const { setOpen, setComponent, setAction, postAuthComponent, setPostAuthComponent } =
    useContext(OpenDrawerContext);

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: FORMS.user });
  const emailProviderMarker = useEmailAuthProviderMarker();

  const fields = useAppSelector(state => state.formFieldsReducer.fields);

  // Form fields per pk_sing_up.html markup, in the markup order.
  const formFields = useMemo(
    () => ['username', 'surname', 'password', 'repeat_password', 'email', 'phone'],
    []
  );

  const canSubmit = useMemo(
    () => formFields.every(field => fields[field]?.valid),
    [fields, formFields]
  );

  const formData = useMemo(
    () =>
      formFields.map(marker => {
        // formFields is a hardcoded marker list (no attribute.type at hand); join to the fetched
        // schema so the payload carries the real attribute.type instead of a flat 'string'.
        const attribute = data?.attributes.find((f: IFormAttribute) => f.marker === marker);
        return {
          marker,
          type: attribute?.type ?? 'string',
          value: fields[marker]?.value || '',
        };
      }),
    [data?.attributes, fields, formFields]
  );

  const onSignUpHandle = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canSubmit) return;

      // `formIdentifier` must match the auth provider's `formIdentifier`.
      const data: ISignUpData = {
        formIdentifier: FORMS.user,
        authData: [
          {
            marker: 'email',
            value: fields.email?.value || '',
          },
          {
            marker: 'password',
            value: fields.password?.value || '',
          },
        ],
        formData,
        notificationData: (() => {
          const phone = normalizePhoneE164(fields.phone?.value);
          return {
            email: fields.email?.value || '',
            phonePush: phone ? [phone] : [],
            phoneSMS: phone,
          };
        })(),
      };

      setLoading(true);

      try {
        const res = await getApi().AuthProvider.signUp(emailProviderMarker, data);

        if (isError(res)) {
          // Sign-up error — stay on SignUpForm: the user was not created, do not switch to VerificationForm.
          const err = res as { statusCode?: number; message?: string };
          setError(err.message || `Error ${err.statusCode ?? ''}`);
        } else {
          const entity = res as ISignUpEntity;
          if (entity.isActive) {
            await logInUser({
              method: emailProviderMarker,
              login: entity.identifier,
              password: fields.password?.value || '',
            });
            authenticate();
            if (onSuccess) {
              onSuccess();
            } else if (postAuthComponent) {
              // Caller (e.g. bottom-menu profile tap) wants to land on a specific drawer after auth.
              setComponent(postAuthComponent);
              setPostAuthComponent('');
            } else {
              setOpen(false);
            }
          } else if (onNeedActivation) {
            onNeedActivation();
          } else {
            setOpen(true);
            setComponent('VerificationForm');
            setAction('activateUser');
          }
          setError('');
        }
      } catch (e: unknown) {
        setError((e as { message?: string })?.message ?? 'Sign-up failed');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, formData, canSubmit]
  );

  return (
    <FormAnimations className={''} isLoading={isLoading} isActive={true}>
      <form onSubmit={onSignUpHandle} className="mx-auto flex w-full max-w-100 flex-col gap-5">
        <p className="text-xl leading-150 font-normal text-white">
          {t('sign_up_subtitle', 'Sign in or create account to quickly manage order')}
        </p>
        <div className="box-border flex shrink-0 flex-col gap-5">
          {formFields
            .map(marker => data?.attributes.find((f: IFormAttribute) => f.marker === marker))
            .filter((f): f is IFormAttribute => Boolean(f))
            .map((field, index) => (
              <FormInput key={field.marker} index={index} {...field} />
            ))}
        </div>
        <SubmitButton title={t('sign_up_text', '')} isLoading={loading || isLoading} index={10} />
        {error && <ErrorMessage error={error} />}
      </form>
    </FormAnimations>
  );
};

export default SignUpForm;
