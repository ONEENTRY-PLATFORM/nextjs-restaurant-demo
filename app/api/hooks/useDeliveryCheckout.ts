'use client';

import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import { useMemo } from 'react';

import {
  useGetAccountsQuery,
  useGetFormByMarkerQuery,
  useGetOrderStorageByMarkerQuery,
} from '@/app/api';
import { FORMS } from '@/app/utils/constants';

export type DeliveryCheckout = {
  /** Resolved order-storage marker (`createOrder` first arg). */
  storageMarker: string;
  /** Resolved order form marker (`createOrder` body + `getFormByMarker`). */
  formIdentifier: string;
  /** Delivery order form (field schema, placeholders, time slots). */
  form?: IFormsEntity | undefined;
  /** Payment accounts intersected with `storage.paymentAccountIdentifiers` (all visible when none linked). */
  accounts: IAccountsEntity[];
  /** Whether storage / form / accounts are still loading. */
  isLoading: boolean;
};

/**
 * useDeliveryCheckout — resolves the delivery checkout config from the order storage, not hard-codes.
 *
 * Reads the `delivery_order` storage (`getOrdersStorageByMarker`) to obtain its real `formIdentifier`
 * and linked `paymentAccountIdentifiers`, then loads that form and intersects the global payment
 * accounts with the storage's linked set (falling back to all visible accounts when none are linked,
 * per the orders rule). The `delivery_order` marker is only a selector for *which* storage — the form
 * identifier and payment methods come from the storage entity. All values degrade gracefully to the
 * `delivery_order` constant / global accounts when the storage read fails (e.g. unauthenticated).
 *
 * @returns Resolved `{ storageMarker, formIdentifier, form, accounts, isLoading }`.
 */
export const useDeliveryCheckout = (): DeliveryCheckout => {
  const { data: storage, isLoading: storageLoading } = useGetOrderStorageByMarkerQuery({
    marker: FORMS.deliveryOrder,
  });

  const storageMarker = storage?.identifier ?? FORMS.deliveryOrder;
  const formIdentifier = storage?.formIdentifier ?? FORMS.deliveryOrder;

  const { data: form, isLoading: formLoading } = useGetFormByMarkerQuery({
    marker: formIdentifier,
  });
  const { data: accountsData, isLoading: accountsLoading } = useGetAccountsQuery({});

  const allowedIdentifiers = useMemo(() => {
    const list = (storage?.paymentAccountIdentifiers ?? []) as Array<{ identifier: string }>;
    return new Set(list.map(x => x.identifier));
  }, [storage]);

  const accounts = useMemo<IAccountsEntity[]>(() => {
    const visible = (accountsData ?? []).filter(a => a.isVisible !== false && a.isUsed !== false);
    if (allowedIdentifiers.size === 0) return visible;
    return visible.filter(a => allowedIdentifiers.has(a.identifier));
  }, [accountsData, allowedIdentifiers]);

  return {
    storageMarker,
    formIdentifier,
    form,
    accounts,
    isLoading: storageLoading || formLoading || accountsLoading,
  };
};
