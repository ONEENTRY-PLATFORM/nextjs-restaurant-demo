/**
 * errorGuard.test.ts — control flow of the server cart/wishlist self-healing guard.
 *
 * `findMissingProductIds` hits the live SDK, so it is covered by injecting a fake `validate`
 * into `errorGuard` here (deterministic, no network) — the real existence lookup is exercised
 * end-to-end by the app. The `oneentry` package is stubbed via `__mocks__/oneentry.js`
 * (moduleNameMapper), so importing the module graph does not touch the backend.
 */
import { describe, expect, it, jest } from '@jest/globals';

import { errorGuard, isMissingProductsError } from '@/app/api/hooks/errorGuard';

type CartItem = { productId: number; qty: number };

const MISSING_ERR = { statusCode: 400, message: 'Some products do not exist' };

describe('isMissingProductsError', () => {
  it('is true for the 400 "Some products do not exist" envelope', () => {
    expect(isMissingProductsError(MISSING_ERR)).toBe(true);
  });

  it('is case-insensitive on the message', () => {
    expect(isMissingProductsError({ statusCode: 400, message: 'PRODUCT DOES NOT EXIST' })).toBe(
      true
    );
  });

  it('is false for other statuses (auth / server errors)', () => {
    expect(isMissingProductsError({ statusCode: 401, message: 'Some products do not exist' })).toBe(
      false
    );
    expect(isMissingProductsError({ statusCode: 500, message: 'do not exist' })).toBe(false);
  });

  it('is false for a 400 with an unrelated message', () => {
    expect(isMissingProductsError({ statusCode: 400, message: 'Validation failed' })).toBe(false);
  });

  it('is false for success responses and non-objects', () => {
    expect(isMissingProductsError({ items: [], total: 0 })).toBe(false);
    expect(isMissingProductsError(null)).toBe(false);
    expect(isMissingProductsError(undefined)).toBe(false);
  });
});

describe('errorGuard', () => {
  const items: CartItem[] = [
    { productId: 1, qty: 2 },
    { productId: 999, qty: 1 },
    { productId: 3, qty: 5 },
  ];

  it('returns the write result untouched on success (no validate, no prune)', async () => {
    const ok = { items, total: 3 };
    const write = jest.fn<(i: CartItem[]) => Promise<typeof ok>>().mockResolvedValue(ok);
    const onPhantom = jest.fn();
    const validate = jest.fn<(ids: number[]) => Promise<number[]>>();

    const res = await errorGuard(items, write, onPhantom, validate);

    expect(res).toBe(ok);
    expect(write).toHaveBeenCalledTimes(1);
    expect(validate).not.toHaveBeenCalled();
    expect(onPhantom).not.toHaveBeenCalled();
  });

  it('does not heal a non-missing-products error (e.g. transient 500)', async () => {
    const err = { statusCode: 500, message: 'Internal error' };
    const write = jest.fn<(i: CartItem[]) => Promise<typeof err>>().mockResolvedValue(err);
    const onPhantom = jest.fn();
    const validate = jest.fn<(ids: number[]) => Promise<number[]>>();

    const res = await errorGuard(items, write, onPhantom, validate);

    expect(res).toBe(err);
    expect(write).toHaveBeenCalledTimes(1);
    expect(validate).not.toHaveBeenCalled();
    expect(onPhantom).not.toHaveBeenCalled();
  });

  it('prunes phantom ids and retries once with only the survivors', async () => {
    const ok = { items: [], total: 2 };
    const write = jest
      .fn<(i: CartItem[]) => Promise<unknown>>()
      .mockResolvedValueOnce(MISSING_ERR)
      .mockResolvedValueOnce(ok);
    const onPhantom = jest.fn();
    const validate = jest.fn<(ids: number[]) => Promise<number[]>>().mockResolvedValue([999]);

    const res = await errorGuard(items, write, onPhantom, validate);

    expect(res).toBe(ok);
    expect(validate).toHaveBeenCalledWith([1, 999, 3]);
    expect(onPhantom).toHaveBeenCalledWith([999]);
    expect(write).toHaveBeenCalledTimes(2);
    // retry drops the phantom id, keeps the rest
    expect(write).toHaveBeenLastCalledWith([
      { productId: 1, qty: 2 },
      { productId: 3, qty: 5 },
    ]);
  });

  it('gives up (no prune, no retry) when no id can be confirmed missing — avoids a loop', async () => {
    const write = jest.fn<(i: CartItem[]) => Promise<unknown>>().mockResolvedValue(MISSING_ERR);
    const onPhantom = jest.fn();
    const validate = jest.fn<(ids: number[]) => Promise<number[]>>().mockResolvedValue([]);

    const res = await errorGuard(items, write, onPhantom, validate);

    expect(res).toBe(MISSING_ERR);
    expect(onPhantom).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledTimes(1);
  });
});
