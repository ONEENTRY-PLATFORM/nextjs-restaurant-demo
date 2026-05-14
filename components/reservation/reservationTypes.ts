import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { IOrdersFormData } from 'oneentry/dist/orders/ordersInterfaces';

/** Single form field value — always a string in this form. */
export type FieldValue = string;

/** Translator function returned by `useT()` — `(marker, fallback) => string`. */
export type Translate = (marker: string, fallback: string) => string;

/** Single row in the rendered booking form: either a full-width attr or a pair. */
export type FormRow =
  | { kind: 'full'; attr: IFormAttribute }
  | { kind: 'pair'; left: IFormAttribute; right?: IFormAttribute };

/** Current step of the reservation wizard. */
export type ReservationStep =
  | { kind: 'form' }
  | { kind: 'auth'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'payment'; formData: IOrdersFormData[]; summary: string }
  | { kind: 'success'; orderId: number; summary: string };

/** Sub-step of the auth screen (sign-in / sign-up / forgot / verification / reset). */
export type AuthSubStep =
  | 'providers'
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'verification-otp'
  | 'verification-activate'
  | 'reset-password';
