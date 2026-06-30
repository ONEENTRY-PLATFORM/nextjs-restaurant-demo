/**
 * The module under test holds a one-shot flag in module scope — so each test
 * needs a freshly-loaded copy of the module. `jest.isolateModules` gives us
 * that without globally resetting state between assertions inside the same it().
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type * as HeaderAnimStateModule from '@/app/animations/headerAnimState';

type Module = typeof HeaderAnimStateModule;

/**
 * loadFresh — synchronously loads a brand-new instance of the module under test.
 *
 * @returns The module exports with `complete=false` and an empty listener set.
 */
const loadFresh = (): Module => {
  let mod!: Module;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@/app/animations/headerAnimState') as Module;
  });
  return mod;
};

describe('headerAnimState', () => {
  let mod: Module;

  beforeEach(() => {
    mod = loadFresh();
  });

  it('starts with the flag set to false', () => {
    expect(mod.isHeaderAnimationComplete()).toBe(false);
  });

  it('markHeaderAnimationComplete flips the flag and notifies subscribers', () => {
    const a = jest.fn();
    const b = jest.fn();
    mod.subscribeHeaderAnimation(a);
    mod.subscribeHeaderAnimation(b);
    mod.markHeaderAnimationComplete();
    expect(mod.isHeaderAnimationComplete()).toBe(true);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('subsequent markHeaderAnimationComplete calls are a no-op (listeners not re-fired)', () => {
    const fn = jest.fn();
    mod.subscribeHeaderAnimation(fn);
    mod.markHeaderAnimationComplete();
    mod.markHeaderAnimationComplete();
    mod.markHeaderAnimationComplete();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('subscribers added AFTER the flag is set are NOT auto-fired (caller must check)', () => {
    mod.markHeaderAnimationComplete();
    const late = jest.fn();
    mod.subscribeHeaderAnimation(late);
    expect(late).not.toHaveBeenCalled();
    // …but the consumer can detect it and call themselves.
    expect(mod.isHeaderAnimationComplete()).toBe(true);
  });

  it('unsubscribe removes the listener so it is not invoked', () => {
    const fn = jest.fn();
    const unsubscribe = mod.subscribeHeaderAnimation(fn);
    unsubscribe();
    mod.markHeaderAnimationComplete();
    expect(fn).not.toHaveBeenCalled();
  });

  it('unsubscribe is idempotent (calling it twice does not throw)', () => {
    const unsubscribe = mod.subscribeHeaderAnimation(jest.fn());
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
  });

  it('listener set deduplicates the same function reference (Set semantics)', () => {
    const fn = jest.fn();
    mod.subscribeHeaderAnimation(fn);
    mod.subscribeHeaderAnimation(fn); // same ref — Set keeps one
    mod.markHeaderAnimationComplete();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
