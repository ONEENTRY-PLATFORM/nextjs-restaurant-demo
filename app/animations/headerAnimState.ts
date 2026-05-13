/**
 * Shared client-side flag indicating whether the initial header reveal has finished.
 *
 * Used to coordinate components that should wait for `HeaderAnimations` to complete
 * before fading themselves in (e.g. `HomePromo` via `HeaderAnimGate`).
 *
 * The flag is module-scoped, so it persists across SPA navigations but resets on a
 * full page reload — matching the lifecycle of the one-shot header animation itself.
 */

let complete = false;
const listeners = new Set<() => void>();

/**
 * markHeaderAnimationComplete — flips the shared flag to `true` and notifies subscribers.
 *
 * Called from `HeaderAnimations` once its GSAP timeline finishes. No-op on repeat calls.
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
 * If the animation has already finished, the listener is NOT called automatically — callers
 * should check `isHeaderAnimationComplete()` first.
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
