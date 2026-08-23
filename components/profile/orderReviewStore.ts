'use client';

import type { IOrderByMarkerEntity, IProductsEntity } from 'oneentry/types';
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

/**
 * subscribe — `useSyncExternalStore` subscriber: registers the callback and returns an unsubscribe function.
 *
 * @param   {() => void}   cb - Listener invoked on every state change.
 * @returns Unsubscribe function.
 */
const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/**
 * getSnapshot — current `OrderReviewTarget` for `useSyncExternalStore`.
 *
 * @returns Current target.
 */
const getSnapshot = (): OrderReviewTarget => state;

/**
 * getServerSnapshot — SSR fallback (the popup is client-side, but `useSyncExternalStore` requires a server snapshot).
 *
 * @returns Empty target.
 */
const getServerSnapshot = (): OrderReviewTarget => EMPTY;

/**
 * setOrderReviewTarget — publishes a new target and notifies subscribers.
 *
 * @param   {OrderReviewTarget} target - Order + product map to expose to the popup.
 * @returns
 */
export const setOrderReviewTarget = (target: OrderReviewTarget): void => {
  state = target;
  listeners.forEach(l => l());
};

/**
 * clearOrderReviewTarget — resets the target to empty and notifies subscribers.
 *
 * @returns
 */
export const clearOrderReviewTarget = (): void => {
  state = EMPTY;
  listeners.forEach(l => l());
};

/**
 * useOrderReviewTarget — React hook that subscribes a component to the current `OrderReviewTarget`.
 *
 * @returns Current `OrderReviewTarget` value.
 */
export const useOrderReviewTarget = (): OrderReviewTarget =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
