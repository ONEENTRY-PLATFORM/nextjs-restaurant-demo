'use client';

import type { IError } from 'oneentry/dist/base/utils';
import type { ICartResponse, IWishlistResponse } from 'oneentry/dist/users/usersInterfaces';
import { useMemo } from 'react';

import { getApi, isError } from '@/app/api';

/** Operations over the server-side cart. All resolve to `null` on SDK error (graceful). */
export type ServerCartApi = {
  get: () => Promise<ICartResponse | null>;
  add: (productId: number, qty?: number) => Promise<ICartResponse | null>;
  remove: (productId: number) => Promise<ICartResponse | null>;
  set: (items: Array<{ productId: number; qty: number }>) => Promise<ICartResponse | null>;
};

/** Operations over the server-side wishlist. All resolve to `null` on SDK error (graceful). */
export type ServerWishlistApi = {
  get: () => Promise<IWishlistResponse | null>;
  add: (productId: number) => Promise<IWishlistResponse | null>;
  remove: (productId: number) => Promise<IWishlistResponse | null>;
};

/**
 * useServerCart — cross-device cart stored on the OneEntry server.
 *
 * Works for authenticated users and for anonymous guests (the SDK sends the
 * `x-guest-id` header automatically in the browser). This is the foundation for
 * migrating the local Redux cart to a server-synced one; it is additive and does
 * not touch the existing Redux store. Stores only `{ productId, qty }` — resolve
 * full product data via `Products.getProductsByIds`.
 *
 * @returns Stable `{ get, add, remove, set }` cart operations.
 */
export const useServerCart = (): ServerCartApi => {
  return useMemo<ServerCartApi>(() => {
    // getApi() is read lazily inside each call — the instance is recreated on login (reDefine).
    const unwrap = (res: ICartResponse | IError): ICartResponse | null =>
      isError(res) ? null : res;
    return {
      get: async () => unwrap(await getApi().Users.getCart()),
      add: async (productId, qty = 1) => unwrap(await getApi().Users.addCartItem({ productId, qty })),
      remove: async productId => unwrap(await getApi().Users.removeCartItem(productId)),
      set: async items => unwrap(await getApi().Users.setCart({ items })),
    };
  }, []);
};

/**
 * useServerWishlist — cross-device wishlist stored on the OneEntry server.
 *
 * Same guest/user semantics as {@link useServerCart}. Stores only `{ productId }`.
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
    };
  }, []);
};
