'use client';

import type { ICartResponse, IError, IWishlistResponse } from 'oneentry/types';
import { useMemo } from 'react';

import { getApi, isError } from '@/app/api/api/api';

/**
 * Operations over the server-side cart. Reads resolve to `null` on SDK error (graceful);
 * `set` returns the raw SDK envelope (`ICartResponse | IError`) so callers can react to a
 * `400 "Some products do not exist"` — see {@link errorGuard}.
 */
export type ServerCartApi = {
  get: () => Promise<ICartResponse | null>;
  add: (productId: number, qty?: number) => Promise<ICartResponse | null>;
  remove: (productId: number) => Promise<ICartResponse | null>;
  set: (items: Array<{ productId: number; qty: number }>) => Promise<ICartResponse | IError | null>;
};

/**
 * Operations over the server-side wishlist. Reads resolve to `null` on SDK error (graceful);
 * `set` returns the raw SDK envelope (`IWishlistResponse | IError`) so callers can react to a
 * `400 "Some products do not exist"` — see {@link errorGuard}.
 */
export type ServerWishlistApi = {
  get: () => Promise<IWishlistResponse | null>;
  add: (productId: number) => Promise<IWishlistResponse | null>;
  remove: (productId: number) => Promise<IWishlistResponse | null>;
  set: (items: Array<{ productId: number }>) => Promise<IWishlistResponse | IError | null>;
};

/**
 * useServerCart — cross-device cart stored on the OneEntry server.
 *
 * @returns Stable `{ get, add, remove, set }` cart operations.
 */
export const useServerCart = (): ServerCartApi => {
  return useMemo<ServerCartApi>(() => {
    const unwrap = (res: ICartResponse | IError): ICartResponse | null =>
      isError(res) ? null : res;
    return {
      get: async () => unwrap(await getApi().Users.getCart()),
      add: async (productId, qty = 1) =>
        unwrap(await getApi().Users.addCartItem({ productId, qty })),
      remove: async productId => unwrap(await getApi().Users.removeCartItem(productId)),
      // Raw envelope (not unwrapped): errorGuard inspects the IError to heal stale ids.
      set: async items => {
        try {
          return await getApi().Users.setCart({ items });
        } catch {
          return null;
        }
      },
    };
  }, []);
};

/**
 * useServerWishlist — cross-device wishlist stored on the OneEntry server.
 *
 * @returns Stable `{ get, add, remove }` wishlist operations.
 */
export const useServerWishlist = (): ServerWishlistApi => {
  return useMemo<ServerWishlistApi>(() => {
    const unwrap = (res: IWishlistResponse | IError): IWishlistResponse | null =>
      isError(res) ? null : res;
    return {
      get: async () => unwrap(await getApi().Users.getWishlist()),
      add: async productId => unwrap(await getApi().Users.addWishlistItem({ productId })),
      remove: async productId => unwrap(await getApi().Users.removeWishlistItem(productId)),
      // Raw envelope (not unwrapped): errorGuard inspects the IError to heal stale ids.
      set: async items => {
        try {
          return await getApi().Users.setWishlist({ items });
        } catch {
          return null;
        }
      },
    };
  }, []);
};
