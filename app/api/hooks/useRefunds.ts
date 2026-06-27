'use client';

import type { ICreateRefundRequest, IRefundRequest } from 'oneentry/dist/orders/ordersInterfaces';
import { useMemo } from 'react';

import { getApi, isError } from '@/app/api';

/** Refund operations for a single order. Reads degrade to `[]`, writes to `false` on error. */
export type RefundsApi = {
  list: (orderId: number) => Promise<IRefundRequest[]>;
  create: (
    orderId: number,
    products: ICreateRefundRequest['products'],
    note?: string
  ) => Promise<boolean>;
  cancel: (orderId: number) => Promise<boolean>;
};

/**
 * useRefunds — order refund requests via the Orders API (requires auth).
 *
 * @returns Stable `{ list, create, cancel }` refund operations.
 */
export const useRefunds = (): RefundsApi =>
  useMemo<RefundsApi>(
    () => ({
      list: async orderId => {
        const res = await getApi().Orders.getRefunds(orderId);
        return isError(res) ? [] : res;
      },
      create: async (orderId, products, note) => {
        const body: ICreateRefundRequest = { products, ...(note ? { note } : {}) };
        const res = await getApi().Orders.createRefundRequest(orderId, body);
        return res === true;
      },
      cancel: async orderId => {
        const res = await getApi().Orders.cancelRefundRequest(orderId);
        return res === true;
      },
    }),
    []
  );
