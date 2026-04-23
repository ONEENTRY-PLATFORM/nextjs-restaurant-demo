/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IAttributes } from 'oneentry/dist/base/utils';
import type { JSX, Key } from 'react';
import { useEffect, useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import { FormFieldsEnum } from '@/app/types/enum';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import EyeIcon from '@/components/icons/eye';
import EyeOpenIcon from '@/components/icons/eye-o';

/**
 * FormInput
 */
const FormInput = (
  field: IAttributes & { value?: string; index: number },
): JSX.Element => {
  const { localizeInfos } = field;
  const [value, setValue] = useState<string>(field.value || '');
  const [type, setType] = useState<string>('');
  const dispatch = useAppDispatch();
  const valid = true;

  const fieldType = (FormFieldsEnum as unknown as FormFieldsEnum)[
    field.marker.indexOf('password') !== -1
      ? 'password'
      : field.marker.indexOf('email') !== -1
        ? 'email'
        : (field.type as any)
  ];

  const validators = field.validators as Record<string, any> | undefined;
  const required =
    (validators?.['requiredValidator'] as { strict?: boolean } | undefined)
      ?.strict || false;
  const minLength = (
    validators?.['stringInspectionValidator'] as
      | { stringMin?: number }
      | undefined
  )?.stringMin;
  const maxLength = (
    validators?.['stringInspectionValidator'] as
      | { stringMax?: number }
      | undefined
  )?.stringMax;

  useEffect(() => {
    dispatch(
      addField({
        [field.marker]: {
          valid: valid,
          value: value,
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, valid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(fieldType || 'text');
  }, [fieldType]);

  if (!field || !type) {
    return <></>;
  }

  return (
    <FormFieldAnimations
      index={field.index}
      className="relative box-border flex shrink-0 flex-col"
    >
      <label htmlFor={field.marker} className="text-xl text-white">
        {localizeInfos?.title}{' '}
        {required && <span className="text-red-500">*</span>}
      </label>
      {/* inputType select */}
      {type === 'list' && (
        <select
          id={field.marker}
          className="bg-transparent border-b text-white text-[20px] font-normal h-10 w-full  focus:outline-[#b0bcce]"
          required={required}
          value={value}
          onChange={(val) => setValue(val.currentTarget.value)}
        >
          {field.listTitles.map((option, i: Key) => {
            return (
              <option key={i} value={option.value as string}>
                {option.title}
              </option>
            );
          })}
        </select>
      )}
      {/* inputType textarea */}
      {type === 'textarea' && (
        <textarea
          id={field.marker}
          placeholder={localizeInfos?.title}
          className="bg-transparent border-b text-white text-[20px] font-normal h-10 w-full  focus:outline-[#b0bcce]"
          required={required}
          onChange={(val) => setValue(val.currentTarget.value)}
          value={value}
        />
      )}
      {/* inputType text/password/email... */}
      {type !== 'textarea' && type !== 'list' && (
        <input
          type={type}
          id={field.marker}
          placeholder={localizeInfos?.title}
          className="bg-transparent border-b text-white text-[20px] font-normal h-10 w-full  focus:outline-[#b0bcce]"
          required={required}
          onChange={(val) => setValue(val.currentTarget.value)}
          autoComplete={fieldType === 'password' ? 'password' : ''}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
        />
      )}
      {/* password button */}
      {fieldType === 'password' && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (type === 'password') {
              setType('text');
            } else {
              setType('password');
            }
          }}
          className="absolute bottom-3 right-2 flex size-6 items-center"
        >
          {type === 'password' ? <EyeIcon /> : <EyeOpenIcon />}
        </button>
      )}
    </FormFieldAnimations>
  );
};

export default FormInput;
