'use client';

import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useSyncExternalStore } from 'react';

/**
 * Внешнее значение, которое OrdersList публикует перед открытием
 * `OrderReviewPopup`, и которое попап читает в свой рендер. Хранится
 * вне React-tree (модульный singleton), потому что `OpenDrawerContext`
 * умеет передавать в попап только строковый `action`, а здесь нужны
 * полная сущность заказа + map продуктов для фолбэка обложки.
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

// SSR-фолбэк. Попап рендерится только клиентом (`'use client'`), но
// `useSyncExternalStore` всё равно требует серверный snapshot.
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
