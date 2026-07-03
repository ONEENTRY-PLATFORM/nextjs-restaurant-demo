'use client';

import type { IError } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';

import { getApi, getLang, isError } from '@/app/api/api/api';

/**
 * OneEntry caps a single `getProductsByIds` response at 30 rows (the default, non-overridable via
 * this SDK method's typed query) — validate in chunks of exactly this size so no chunk is ever
 * truncated (which would mis-flag a real product as missing and prune it from the cart).
 */
const EXISTENCE_CHUNK = 30;

/**
 * isMissingProductsError — whether a OneEntry cart/wishlist write was rejected because some of
 * the referenced products no longer exist in the catalog.
 *
 * `Users.setCart` / `Users.setWishlist` validate every `productId` and reject the WHOLE payload
 * with `400 "Some products do not exist"` when at least one id is stale (e.g. a product deleted in
 * the CMS that still lingers in the redux-persist cart).
 *
 * @param   {unknown} res - Result returned by a server cart/wishlist write.
 * @returns `true` when `res` is the "some products do not exist" 400 error envelope.
 */
export const isMissingProductsError = (res: unknown): res is IError =>
  isError(res) &&
  res.statusCode === 400 &&
  typeof res.message === 'string' &&
  res.message.toLowerCase().includes('not exist');

/**
 * findMissingProductIds — resolves which of `ids` no longer exist in the OneEntry catalog.
 *
 * Queries `Products.getProductsByIds` in chunks (it silently drops ids that don't exist and caps
 * each response at 30 rows) and returns the ids that were requested but not returned. A chunk that
 * errors out (transient / "Resource is closed") is skipped — its ids are treated as "unknown", not
 * missing, so a server hiccup never prunes real products from the cart.
 *
 * @param   {number[]} ids - Product ids to validate (duplicates are ignored).
 * @returns Ids that are confirmed absent from the catalog (safe to prune).
 */
export const findMissingProductIds = async (ids: number[]): Promise<number[]> => {
  const unique = [...new Set(ids)].filter(id => Number.isFinite(id));
  if (unique.length === 0) {
    return [];
  }
  const missing: number[] = [];
  for (let i = 0; i < unique.length; i += EXISTENCE_CHUNK) {
    const chunk = unique.slice(i, i + EXISTENCE_CHUNK);
    const res = await getApi().Products.getProductsByIds(chunk.join(','), getLang());
    if (!Array.isArray(res)) {
      // Transient error for this chunk — do not flag its ids as missing.
      continue;
    }
    const existing = new Set((res as IProductsEntity[]).map(product => product.id));
    for (const id of chunk) {
      if (!existing.has(id)) {
        missing.push(id);
      }
    }
  }
  return missing;
};

/**
 * errorGuard — runs a server cart/wishlist write and self-heals the "some products do not exist"
 * rejection.
 *
 * On the happy path (and on any non-"missing-products" error) the raw write result is returned
 * unchanged. On a `400 "Some products do not exist"` it resolves the phantom ids via `validate`,
 * hands them to `onPhantom` (which prunes them from the persisted Redux store), and retries the
 * write exactly once with only the surviving items. The single retry — plus giving up when no id
 * can be confirmed missing — bounds the work and prevents a retry loop.
 *
 * @param   {Item[]}                                            items     - Items to write (each carries a `productId`).
 * @param   {(items: Item[]) => Promise<Res | IError | null>}  write     - Raw server write (returns the SDK envelope, not a swallowed `null`).
 * @param   {(phantomIds: number[]) => void}                   onPhantom - Prunes confirmed-missing ids from local state.
 * @param   {(ids: number[]) => Promise<number[]>}             validate  - Resolves which ids are missing (defaults to {@link findMissingProductIds}; injectable for tests).
 * @returns The write result — the retried write on a healed rejection, otherwise the original result.
 */
export const errorGuard = async <Item extends { productId: number }, Res>(
  items: Item[],
  write: (items: Item[]) => Promise<Res | IError | null>,
  onPhantom: (phantomIds: number[]) => void,
  validate: (ids: number[]) => Promise<number[]> = findMissingProductIds
): Promise<Res | IError | null> => {
  const res = await write(items);
  if (!isMissingProductsError(res)) {
    return res;
  }

  const phantomIds = await validate(items.map(item => item.productId));
  if (phantomIds.length === 0) {
    // Server rejected the payload but every id still resolves — cannot heal, give up (no loop).
    return res;
  }

  onPhantom(phantomIds);
  const phantom = new Set(phantomIds);
  const survivors = items.filter(item => !phantom.has(item.productId));
  return write(survivors);
};
