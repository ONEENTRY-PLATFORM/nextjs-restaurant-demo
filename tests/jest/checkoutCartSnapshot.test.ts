import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  clearCheckoutCartSnapshot,
  saveCheckoutCartSnapshot,
  takeCheckoutCartSnapshot,
} from '@/app/utils/checkoutCartSnapshot';

const STORAGE_KEY = 'checkout-cart-snapshot';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const ITEMS = [
  { id: 1, quantity: 2, selected: true },
  { id: 7, quantity: 1, selected: false },
];

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('checkoutCartSnapshot — save / take roundtrip', () => {
  it('take returns the saved items and removes the key (single consumption)', () => {
    saveCheckoutCartSnapshot(ITEMS, 42);

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(takeCheckoutCartSnapshot()).toEqual(ITEMS);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    // A second take must not resurrect anything.
    expect(takeCheckoutCartSnapshot()).toBeNull();
  });

  it('tags the snapshot with the order id and a timestamp', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    saveCheckoutCartSnapshot(ITEMS, 42);

    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string);
    expect(raw.orderId).toBe(42);
    expect(raw.savedAt).toBe(1_000_000);
    expect(raw.items).toEqual(ITEMS);
  });

  it('does not write anything for an empty cart', () => {
    saveCheckoutCartSnapshot([], 42);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('overwrites a previous snapshot (last checkout wins)', () => {
    saveCheckoutCartSnapshot(ITEMS, 42);
    saveCheckoutCartSnapshot([{ id: 9, quantity: 3, selected: true }], 43);
    expect(takeCheckoutCartSnapshot()).toEqual([{ id: 9, quantity: 3, selected: true }]);
  });
});

describe('checkoutCartSnapshot — TTL and validation', () => {
  it('returns null (and consumes the key) for a snapshot older than the TTL', () => {
    const now = 10_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    saveCheckoutCartSnapshot(ITEMS, 42);

    jest.spyOn(Date, 'now').mockReturnValue(now + SIX_HOURS_MS + 1);
    expect(takeCheckoutCartSnapshot()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('still restores a snapshot exactly at the TTL boundary', () => {
    const now = 10_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    saveCheckoutCartSnapshot(ITEMS, 42);

    jest.spyOn(Date, 'now').mockReturnValue(now + SIX_HOURS_MS);
    expect(takeCheckoutCartSnapshot()).toEqual(ITEMS);
  });

  it('returns null when the key is absent', () => {
    expect(takeCheckoutCartSnapshot()).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(takeCheckoutCartSnapshot()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns null on a payload without items/savedAt', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ orderId: 1 }));
    expect(takeCheckoutCartSnapshot()).toBeNull();
  });

  it('filters out malformed entries and returns null when nothing valid remains', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        orderId: 1,
        savedAt: 1_000,
        items: [{ id: 3, quantity: 2, selected: true }, { id: 'x', quantity: 1 }, null],
      })
    );
    expect(takeCheckoutCartSnapshot()).toEqual([{ id: 3, quantity: 2, selected: true }]);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ orderId: 1, savedAt: 1_000, items: [null, { id: 'x' }] })
    );
    expect(takeCheckoutCartSnapshot()).toBeNull();
  });
});

describe('checkoutCartSnapshot — clear', () => {
  it('removes the key without restoring', () => {
    saveCheckoutCartSnapshot(ITEMS, 42);
    clearCheckoutCartSnapshot();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('is a no-op when nothing is stored', () => {
    expect(() => clearCheckoutCartSnapshot()).not.toThrow();
  });
});
