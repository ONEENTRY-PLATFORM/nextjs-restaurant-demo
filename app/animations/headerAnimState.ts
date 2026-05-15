/**
 * Shared client-side flag indicating whether the initial header reveal has finished.
 */

let complete = false;
const listeners = new Set<() => void>();

/**
 * markHeaderAnimationComplete — flips the shared flag to `true` and notifies subscribers. No-op on repeat calls.
 *
 * @returns Void.
 */
export const markHeaderAnimationComplete = (): void => {
  if (complete) return;
  complete = true;
  listeners.forEach(l => l());
};

/**
 * subscribeHeaderAnimation — registers a listener fired once the header animation completes.
 *
 * If the animation has already finished, the listener is NOT called automatically — callers should check `isHeaderAnimationComplete()` first.
 *
 * @param   {() => void} listener - Callback invoked when the animation flips to complete.
 * @returns Unsubscribe function that removes the listener.
 */
export const subscribeHeaderAnimation = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * isHeaderAnimationComplete — returns the current value of the shared flag.
 *
 * @returns `true` once the header animation has finished, otherwise `false`.
 */
export const isHeaderAnimationComplete = (): boolean => complete;
