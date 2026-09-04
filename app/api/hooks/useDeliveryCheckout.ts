'use client';

import type { IAccountsEntity, IFormsEntity } from 'oneentry/types';
import { useMemo } from 'react';

import {
  useGetAccountsQuery,
  useGetFormByMarkerQuery,
  useGetOrderStorageByMarkerQuery,
} from '@/app/api/api/RTKApi';
import { FORMS } from '@/app/utils/constants';

import { filterAllowedAccounts } from './checkout.utils';

export type DeliveryCheckout = {
  storageMarker: string;
  formIdentifier: string;
  form?: IFormsEntity | undefined;
  accounts: IAccountsEntity[];
  isLoading: boolean;
};

/**
 * useDeliveryCheckout — resolves the delivery checkout config from the order storage, not hard-codes.
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

  const accounts = useMemo<IAccountsEntity[]>(
    () => filterAllowedAccounts(accountsData, allowedIdentifiers),
    [accountsData, allowedIdentifiers]
  );

  return {
    storageMarker,
    formIdentifier,
    form,
    accounts,
    isLoading: storageLoading || formLoading || accountsLoading,
  };
};
