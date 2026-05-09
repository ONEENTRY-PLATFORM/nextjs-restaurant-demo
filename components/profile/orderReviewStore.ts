'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useSyncExternalStore } from 'react';

/**
 * OrderReviewTarget — published by OrdersList before opening OrderReviewPopup.
 * Singleton outside the React tree, because `OpenDrawerContext` only forwards a string `action`.
 */
export interface OrderReviewTarget {
  order: IOrderByMarkerEntity | null;
  productsById: Map<number, IProductsEntity>;
}

const EMPTY: OrderReviewTarget = { order: null, productsById: new Map() };

let state: OrderReviewTarget = EMPTY;
const listeners = new Set<() => void>();

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const getSnapshot = (): OrderReviewTarget => state;

// SSR fallback: the popup is client-side, but `useSyncExternalStore` requires a server snapshot.
const getServerSnapshot = (): OrderReviewTarget => EMPTY;

export const setOrderReviewTarget = (target: OrderReviewTarget): void => {
  state = target;
  listeners.forEach(l => l());
};

export const clearOrderReviewTarget = (): void => {
  state = EMPTY;
  listeners.forEach(l => l());
};

export const useOrderReviewTarget = (): OrderReviewTarget =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
