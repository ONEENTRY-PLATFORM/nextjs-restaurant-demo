'use client';

import { useSyncExternalStore } from 'react';

/** Never fires — the "store" is constant, so no subscription is needed. */
const subscribe = (): (() => void) => () => {};

/**
 * useHydrated — `false` while rendering on the server and during the first
 * client render, `true` afterwards.
 *
 * Use it to gate anything whose value only exists on the client (persisted
 * Redux state, `localStorage`, `window`), so SSR output and the first hydrated
 * render agree. Built on `useSyncExternalStore` rather than
 * `useEffect + setMounted`, which would be a setState inside an effect body.
 *
 * @returns `true` once the component has hydrated on the client.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
