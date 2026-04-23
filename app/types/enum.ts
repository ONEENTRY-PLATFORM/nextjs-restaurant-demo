/**
 * Language codes mapping
 */
export enum LanguageEnum {
  en = 'en_US',
}

/**
 * Language codes mapping
 */
export enum CurrencyEnum {
  en = 'USD',
}

/**
 * Internationalization codes mapping
 */
export enum IntlEnum {
  en = 'en-US',
}

/**
 * Size options
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
 * Condition markers for filtering
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
 * Form field types mapping
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
  password_confirm = password,
  card_cvc = password,
}
