import { describe, expect, it } from '@jest/globals';

import animationsReducer, {
  getReadyState,
  setReadyState,
} from '@/app/store/reducers/AnimationsSlice';

/**
 * initial — fresh `animationsSlice` state via the reducer's `@@INIT` path.
 *
 * @returns Initial animations-slice state.
 */
const initial = () => animationsReducer(undefined, { type: '@@INIT' });

describe('AnimationsSlice — setReadyState', () => {
  it('starts with readyState=false', () => {
    expect(initial()).toEqual({ readyState: false });
  });

  it('flips readyState to true', () => {
    const state = animationsReducer(initial(), setReadyState({ value: true }));
    expect(state.readyState).toBe(true);
  });

  it('flips readyState back to false', () => {
    const after = animationsReducer(initial(), setReadyState({ value: true }));
    const state = animationsReducer(after, setReadyState({ value: false }));
    expect(state.readyState).toBe(false);
  });

  it('is idempotent (setting the current value is a noop)', () => {
    const after = animationsReducer(initial(), setReadyState({ value: true }));
    const again = animationsReducer(after, setReadyState({ value: true }));
    expect(again.readyState).toBe(true);
  });
});

describe('AnimationsSlice — getReadyState selector', () => {
  it('returns the slice as-is from the root state', () => {
    const rootState = { animationsReducer: { readyState: true } };
    expect(getReadyState(rootState)).toEqual({ readyState: true });
  });
});
