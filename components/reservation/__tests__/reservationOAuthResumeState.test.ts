import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  clearPendingReservationResume,
  consumePendingReservationResume,
  peekPendingReservationResume,
  type ReservationOAuthResume,
  setPendingReservationResume,
} from '../reservationOAuthResumeState';

const STORAGE_KEY = 'reservation-oauth-resume';
const snapshot: ReservationOAuthResume = {
  values: { name: 'Bob', people_count: '4' },
  returnTo: '/reservation',
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('setPendingReservationResume', () => {
  it('serialises the snapshot to sessionStorage', () => {
    setPendingReservationResume(snapshot);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(snapshot));
  });

  it('overwrites a previously stored snapshot', () => {
    setPendingReservationResume(snapshot);
    const next: ReservationOAuthResume = { values: { name: 'Alice' }, returnTo: '/x' };
    setPendingReservationResume(next);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(next);
  });
});

describe('peekPendingReservationResume', () => {
  it('returns null when nothing is stored', () => {
    expect(peekPendingReservationResume()).toBeNull();
  });

  it('returns the parsed snapshot without removing it', () => {
    setPendingReservationResume(snapshot);
    expect(peekPendingReservationResume()).toEqual(snapshot);
    // Still there — peek is non-destructive (multi-peek works).
    expect(peekPendingReservationResume()).toEqual(snapshot);
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('returns null when the stored value is malformed JSON', () => {
    sessionStorage.setItem(STORAGE_KEY, '{not json');
    expect(peekPendingReservationResume()).toBeNull();
  });
});

describe('consumePendingReservationResume', () => {
  it('returns null when nothing is stored', () => {
    expect(consumePendingReservationResume()).toBeNull();
  });

  it('returns the snapshot and removes it (one-shot)', () => {
    setPendingReservationResume(snapshot);
    expect(consumePendingReservationResume()).toEqual(snapshot);
    expect(consumePendingReservationResume()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('still clears storage even when the stored value was malformed', () => {
    sessionStorage.setItem(STORAGE_KEY, '{not json');
    expect(consumePendingReservationResume()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('clearPendingReservationResume', () => {
  it('removes a stored snapshot', () => {
    setPendingReservationResume(snapshot);
    clearPendingReservationResume();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('is a no-op when nothing is stored (does not throw)', () => {
    expect(() => clearPendingReservationResume()).not.toThrow();
  });
});
