export const PAYMENT_ROW_SELECTOR = '.step-payment-row';

export const ADDRESS_MARKERS = ['address_reg', 'address', 'delivery_address'] as const;
export const PHONE_MARKERS = ['phone', 'phone_reg', 'contact_phone'] as const;

export const ASAP_INTERVAL_MIN = 45;

export type DeliveryMode = 'asap' | 'scheduled';
