'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useMemo, useState } from 'react';

import { getApi, isError, useGetFormByMarkerQuery } from '@/app/api';
import { useEnterpriseCaptcha } from '@/app/hooks/useEnterpriseCaptcha';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { FORMS } from '@/app/utils/constants';
import { normalizeErrorMessage } from '@/app/utils/errorHandler';
import { getFormAttributes } from '@/components/utils';

import Loader from '../shared/Loader';
import ErrorMessage from './inputs/ErrorMessage';
import FormInput from './inputs/FormInput';
import FormSubmitButton from './inputs/FormSubmitButton';

type SpamCaptchaSettings = {
  captcha?: { key?: string; action?: string };
};

/**
 * ContactUsForm — contact form driven by the OneEntry `contact_us` form schema.
 *
 * @param   {object} props           - Component props.
 * @param   {string} props.className - Wrapper class merged onto the `<form>`.
 * @returns JSX of the contact form (loader while the schema is fetched).
 */
const ContactUsForm = ({ className }: { className: string }): JSX.Element => {
  const t = useT();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  // Bumped after a successful submit: re-keys the inputs so they remount empty.
  const [formEpoch, setFormEpoch] = useState<number>(0);

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: FORMS.contactUs });

  const fieldsData = useAppSelector(state => state.formFieldsReducer.fields);

  const formFields = getFormAttributes(data)
    .slice()
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

  // captchaKey/action come from OneEntry in `settings.captcha.{key,action}`.
  const spamField = useMemo(() => formFields.find(f => f.type === 'spam'), [formFields]);
  const spamSettings = spamField?.settings as SpamCaptchaSettings | undefined;
  const captcha = useEnterpriseCaptcha(spamSettings?.captcha?.key, spamSettings?.captcha?.action);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!data) return;
    if (spamField && !captcha) {
      setError(t('captcha_loading_text', 'Please wait while captcha is loading.'));
      return;
    }

    const transformedFormData = formFields.map((field: IFormAttribute) => {
      const { marker, type } = field;
      const value = fieldsData[marker as keyof typeof fieldsData]?.value;

      if (type === 'spam') {
        return { marker, type: 'spam', value: captcha };
      }

      // Dispatch on the attribute TYPE (not the marker) — the marker is project
      // data and may differ from the type name.
      switch (type) {
        case 'list':
        case 'radioButton':
          // list/radioButton value is a plain array of selected values, not {title,value}.
          return { marker, type, value: value != null && value !== '' ? [value] : [] };
        case 'text':
          // OneEntry: "Only one of htmlValue, plainValue or mdValue can be provided".
          return {
            marker,
            type: 'text',
            value: [{ plainValue: value }],
          };
        default:
          // Forward the real attribute type (not a hardcoded 'string') so numeric/date
          // fields added in the admin serialize with their actual type per the forms rule.
          return { marker, type, value };
      }
    });

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await getApi().FormData.postFormsData({
        formIdentifier: FORMS.contactUs,
        formData: transformedFormData,
        formModuleConfigId: data?.moduleFormConfigs?.[0]?.id ?? 0,
        moduleEntityIdentifier: data?.moduleFormConfigs?.[0]?.entityIdentifiers?.[0]?.id ?? '',
        replayTo: null,
        status: '',
      });
      // The SDK returns an IError envelope instead of throwing — the API `message`
      // may arrive as a string array; fall back to the form's own unsuccessMessage.
      if (isError(res)) {
        setError(
          normalizeErrorMessage(
            (res as { message?: string | string[] }).message,
            data?.localizeInfos?.unsuccessMessage || t('submit_failed_text', 'Submit failed')
          )
        );
        return;
      }
      setSuccess(data?.localizeInfos?.successMessage || t('form_success_text', 'Message sent'));
      setFormEpoch(epoch => epoch + 1);
    } catch (error: unknown) {
      setError(
        (error as { message?: string })?.message ?? t('submit_failed_text', 'Submit failed')
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <form
      className={`flex min-h-full w-full max-w-107.5 flex-col gap-4 text-xl leading-5 ${className}`}
      onSubmit={handleSubmit}
    >
      <div className="relative mb-4 box-border flex shrink-0 flex-col gap-4">
        {formFields.map((field: IFormAttribute, index: number) => {
          switch (field.type) {
            case 'button':
              return (
                <FormSubmitButton
                  key={index}
                  // The API omits `title` when the form carries no localization
                  // for the requested language — keep the button labelled.
                  title={field.localizeInfos.title ?? 'Submit'}
                  isLoading={loading}
                  index={10}
                />
              );
            case 'spam':
              return null;
            default:
              return <FormInput key={`${formEpoch}-${index}`} index={index} {...field} />;
          }
        })}
      </div>

      {success && <p className="text-sm text-green-500">{success}</p>}
      {error && <ErrorMessage error={error} />}
    </form>
  );
};

export default ContactUsForm;
