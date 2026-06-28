/**
 * Mapping of language codes.
 */
export enum LanguageEnum {
  en = 'en_US',
}

/**
 * Mapping of currency codes.
 */
export enum CurrencyEnum {
  en = 'USD',
}

/**
 * Mapping of internationalization codes.
 */
export enum IntlEnum {
  en = 'en-US',
}

/**
 * Size breakpoints.
 */
export enum Sizes {
  xs = 480,
  sm = 640,
  md = 768,
  lg = 1024,
  xl = 1240,
  xxl = 1536,
}

/**
 * Condition markers for filtering.
 */
export enum ConditionMarkersEnum {
  IN = 'in',
  NIN = 'nin',
  EQ = 'eq',
  NEQ = 'neq',
  MTH = 'mth',
  LTH = 'lth',
  EXS = 'exs',
  NEXS = 'nexs',
}

/**
 * Mapping of form field types.
 */
export enum FormFieldsEnum {
  string = 'text',
  email = 'email',
  password = 'password',
  phone = 'tel',
  date = 'date',
  text = 'textarea',
  list = 'list',
  spam = 'spam',
  button = 'button',

  email_reg = email,
  email_notifications = email,
  phone_reg = phone,
  password_reg = password,
  repeat_password = password,
  card_cvc = password,
}
