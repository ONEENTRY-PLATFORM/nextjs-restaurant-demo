'use client';

import { useSyncExternalStore } from 'react';

const MD_QUERY = '(min-width: 768px)';

/**
 * subscribeMd — `useSyncExternalStore` subscriber for the `md` (768px+) media query.
 *
 * @param   {() => void}   cb - Change listener triggered whenever the match state flips.
 * @returns Unsubscribe function.
 */
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * getMdSnapshot — current client snapshot of the `md` media query match state.
 *
 * @returns `true` when the viewport currently matches `md` (>= 768px).
 */
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;

/**
 * useIsMdUp — `useSyncExternalStore` hook returning whether the viewport is md+ (`min-width: 768px`).
 *
 * The `serverDefault` argument controls what SSR / pre-hydration renders should assume:
 * - `false` (default) — mobile-first; SSR renders the < md layout, then hydration flips to md+ if it matches.
 * - `true` — desktop-first; useful when desktop is the dominant traffic and a mobile-flicker after hydration is preferred over a desktop-flicker.
 *
 * @param   {boolean}  [serverDefault=false] - Match state to assume on the server and the first pre-hydration client render.
 * @returns `true` on md+ viewports, `false` otherwise.
 */
export const useIsMdUp = (serverDefault: boolean = false): boolean =>
  useSyncExternalStore(subscribeMd, getMdSnapshot, () => serverDefault);
