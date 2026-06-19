'use client';

import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormEvent, JSX } from 'react';
import { useMemo, useState } from 'react';

import { getApi, useGetFormByMarkerQuery } from '@/app/api';
import { useEnterpriseCaptcha } from '@/app/hooks/useEnterpriseCaptcha';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { FORMS } from '@/app/utils/constants';

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

  const { data, isLoading } = useGetFormByMarkerQuery({ marker: FORMS.contactUs });

  const fieldsData = useAppSelector(state => state.formFieldsReducer.fields);

  const formFields = data?.attributes
    .slice()
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

  // captchaKey/action come from OneEntry in `settings.captcha.{key,action}`.
  const spamField = useMemo(() => formFields?.find(f => f.type === 'spam'), [formFields]);
  const spamSettings = spamField?.settings as SpamCaptchaSettings | undefined;
  const captcha = useEnterpriseCaptcha(spamSettings?.captcha?.key, spamSettings?.captcha?.action);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formFields) return;
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
          return { marker, type: 'string', value };
      }
    });

    try {
      setLoading(true);
      await getApi().FormData.postFormsData({
        formIdentifier: FORMS.contactUs,
        formData: transformedFormData,
        formModuleConfigId: data?.moduleFormConfigs?.[0]?.id ?? 0,
        moduleEntityIdentifier: data?.moduleFormConfigs?.[0]?.entityIdentifiers?.[0]?.id ?? '',
        replayTo: null,
        status: '',
      });
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
        {formFields?.map((field: IFormAttribute, index: number) => {
          switch (field.type) {
            case 'button':
              return (
                <FormSubmitButton
                  key={index}
                  title={field.localizeInfos.title}
                  isLoading={loading}
                  index={10}
                />
              );
            case 'spam':
              return null;
            default:
              return <FormInput key={index} index={index} {...field} />;
          }
        })}
      </div>

      {error && <ErrorMessage error={error} />}
    </form>
  );
};

export default ContactUsForm;
