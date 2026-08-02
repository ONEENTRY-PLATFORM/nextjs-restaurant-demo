'use client';

import { useSyncExternalStore } from 'react';

import {
  isHeaderAnimationComplete,
  subscribeHeaderAnimation,
} from '@/app/animations/headerAnimState';

/**
 * useHeaderAnimationComplete — subscribes to the shared header-reveal flag.
 *
 * The flag is a module-level external store, so it is read through
 * `useSyncExternalStore` rather than mirrored into component state from an
 * effect: a flag that is already `true` at mount is picked up on the very
 * first render instead of one cascading re-render later, and every gate in the
 * tree shares one subscription pattern.
 *
 * The server snapshot is `false` — the animation only ever runs on the client,
 * so SSR output matches the first hydrated render.
 *
 * @returns `true` once the initial header reveal has finished.
 */
export const useHeaderAnimationComplete = (): boolean =>
  useSyncExternalStore(subscribeHeaderAnimation, isHeaderAnimationComplete, () => false);
