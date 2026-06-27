import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { JSX, Key } from 'react';
import { useEffect, useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addField } from '@/app/store/reducers/FormFieldsSlice';
import { FormFieldsEnum } from '@/app/types/enum';
import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import EyeIcon from '@/components/icons/eye';
import EyeOpenIcon from '@/components/icons/eye-o';

/**
 * FormInput — generic input for OneEntry form fields (string, password, email, list, textarea).
 *
 * @param   {IFormAttribute & { value?: string; index: number }} field - OneEntry form attribute, optionally pre-filled `value` and an `index` for staggered animations.
 * @returns JSX of the labelled input field with field-type-specific renderer.
 */
const FormInput = (field: IFormAttribute & { value?: string; index: number }): JSX.Element => {
  const { localizeInfos } = field;
  const placeholder = String(field.additionalFields?.placeholder?.value ?? '');
  const hint = String(field.additionalFields?.hint?.value ?? '');
  const [value, setValue] = useState<string>(field.value || '');
  const [type, setType] = useState<string>('');
  const dispatch = useAppDispatch();
  const valid = true;

  // HTML input type is driven by the attribute's `type` and the enum's explicit marker-specific
  // keys (`password`, `password_confirm`, `email_reg`, `card_cvc`, `phone_reg`, …) — not by fuzzy
  // substring matching on the marker name.
  const markerKey = field.marker as keyof typeof FormFieldsEnum;
  const fieldKey: keyof typeof FormFieldsEnum =
    markerKey in FormFieldsEnum ? markerKey : (field.type as keyof typeof FormFieldsEnum);
  const fieldType = FormFieldsEnum[fieldKey] ?? FormFieldsEnum.string;

  const validators = field.validators as Record<string, unknown> | undefined;
  const required =
    (validators?.['requiredValidator'] as { strict?: boolean } | undefined)?.strict || false;
  const minLength = (
    validators?.['stringInspectionValidator'] as { stringMin?: number } | undefined
  )?.stringMin;
  const maxLength = (
    validators?.['stringInspectionValidator'] as { stringMax?: number } | undefined
  )?.stringMax;

  useEffect(() => {
    dispatch(
      addField({
        [field.marker]: {
          valid: valid,
          value: value,
        },
      })
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
    <FormFieldAnimations index={field.index} className="box-border flex shrink-0 flex-col">
      <label htmlFor={field.marker} className="cart_label">
        {localizeInfos?.title} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center border-b border-b-muted">
        {type === 'list' && (
          <select
            id={field.marker}
            className="cart_input"
            required={required}
            value={value}
            onChange={val => setValue(val.currentTarget.value)}
          >
            {field.listTitles.map((option, i: Key) => (
              <option key={i} value={option.value as string}>
                {option.title}
              </option>
            ))}
          </select>
        )}
        {type === 'textarea' && (
          <textarea
            id={field.marker}
            placeholder={placeholder}
            className="cart_input"
            required={required}
            onChange={val => setValue(val.currentTarget.value)}
            value={value}
          />
        )}
        {type !== 'textarea' && type !== 'list' && (
          <input
            type={type}
            id={field.marker}
            placeholder={placeholder}
            className="cart_input"
            required={required}
            onChange={val => setValue(val.currentTarget.value)}
            autoComplete={fieldType === 'password' ? 'password' : ''}
            minLength={minLength}
            maxLength={maxLength}
            value={value}
          />
        )}
        {fieldType === 'password' && (
          <button
            type="button"
            onClick={() => setType(prev => (prev === 'password' ? 'text' : 'password'))}
            className="-ml-6.25 flex size-6 shrink-0 items-center"
          >
            {type === 'password' ? <EyeIcon /> : <EyeOpenIcon />}
          </button>
        )}
      </div>
      {hint && <span className="mt-1 text-xs text-paper/60">{hint}</span>}
    </FormFieldAnimations>
  );
};

export default FormInput;
