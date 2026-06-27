import { compileRegex } from './compileRegex';

type MaskValidator = { maskValue?: string };
type StringValidator = {
  stringLength?: number;
  stringMin?: number | string;
  stringMax?: number | string;
};
type ValidatorPayload = MaskValidator & StringValidator & Record<string, unknown>;

export type Validators = {
  requiredValidator: (value: string, validator?: ValidatorPayload) => boolean;
  emailInspectionValidator: (value: string, validator?: ValidatorPayload) => boolean;
  fieldMaskValidator: (value: string, validator: MaskValidator) => boolean;
  stringInspectionValidator: (value: string, validator: StringValidator) => boolean;
  correctPasswordValidator: (value: string, repeatValue: string) => boolean;
};

/**
 * validators — collection of OneEntry FormData field validators (`required`, `email`, mask, string-length, password-match).
 */
export const validators: Validators = {
  requiredValidator: (value: string) => {
    return !!value.length;
  },
  emailInspectionValidator: (value: string) => {
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{1,7}$/;
    return emailRegex.test(value);
  },
  fieldMaskValidator: (value: string, mask: MaskValidator) => {
    const regex = compileRegex(mask?.maskValue as string);
    return regex.test(value);
  },
  stringInspectionValidator: (value: string, validator: StringValidator) => {
    if (
      typeof validator.stringLength === 'number' &&
      validator.stringLength > 0 &&
      value.length === validator.stringLength
    ) {
      return true;
    }
    if (
      value.length <= +(validator.stringMax ?? 0) &&
      value.length >= +(validator.stringMin ?? 0)
    ) {
      return true;
    }
    return false;
  },
  correctPasswordValidator: (value: string, repeatValue: string) => {
    return value === repeatValue;
  },
};
