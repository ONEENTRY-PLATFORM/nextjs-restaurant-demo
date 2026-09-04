import { unstable_cache } from 'next/cache';
import type { IProductsEntity } from 'oneentry/types';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api/api/api';
import { getProducts } from '@/app/api/server/products/getProducts';
import { BLOCKS } from '@/app/utils/constants';

/** Recommendation surfaces backed by the new OneEntry recommendation Blocks. */
export type RecommendationKind =
  'cartComplement' | 'recentlyViewed' | 'trending' | 'personalRecommendations';

const MARKER_BY_KIND: Record<RecommendationKind, string> = {
  cartComplement: BLOCKS.cartComplement,
  recentlyViewed: BLOCKS.recentlyViewed,
  trending: BLOCKS.trending,
  personalRecommendations: BLOCKS.personalRecommendations,
};

/**
 * fetchByKind — dispatches to the matching `Blocks.*` recommendation method.
 *
 * `limit` is the query parameter the endpoints gained in SDK 1.0.162: the block's own
 * quantity setting applies when it is omitted, so the surface asks for exactly what it renders
 * instead of trimming an oversized response.
 *
 * @param   {RecommendationKind} kind   - Recommendation surface.
 * @param   {string}             marker - Block marker for that surface.
 * @param   {string}             lang   - Language code.
 * @param   {number}             limit  - Max products to request from the endpoint.
 * @returns Promise resolving to the SDK result (`IProductsResponse` or `IError`).
 */
const fetchByKind = (kind: RecommendationKind, marker: string, lang: string, limit: number) => {
  const blocks = getApi().Blocks;
  switch (kind) {
    case 'cartComplement':
      return blocks.getCartComplement(marker, lang, undefined, limit);
    case 'recentlyViewed':
      return blocks.getRecentlyViewed(marker, lang, undefined, limit);
    case 'trending':
      return blocks.getTrending(marker, lang, undefined, limit);
    case 'personalRecommendations':
      return blocks.getPersonalRecommendations(marker, lang, undefined, limit);
  }
};

const fetchRecommendations = unstable_cache(
  async (
    kind: RecommendationKind,
    excludeId: number | null,
    limit: number,
    fallbackToCatalog: boolean,
    lang: string
  ): Promise<IProductsEntity[]> => {
    try {
      // One spare item covers the excluded product, so the surface still fills up after filtering.
      const res = await fetchByKind(
        kind,
        MARKER_BY_KIND[kind],
        lang,
        excludeId != null ? limit + 1 : limit
      );
      /**
       * The recommendation endpoints answer with a container, not a bare list:
       * `{ items, total, totalFound? }`. Take `items` — reading the response as
       * an array yielded an empty surface on every request.
       */
      let items = isError(res) ? [] : res.items;
      if (excludeId != null) {
        items = items.filter(p => p.id !== excludeId);
      }

      if (items.length === 0 && fallbackToCatalog) {
        const all = await getProducts({ limit: limit + 1, offset: 0, langCode: lang });
        items = (all.products ?? []).filter(p => p.id !== excludeId);
      }

      return items.slice(0, limit);
    } catch {
      return [];
    }
  },
  ['oneentry-getRecommendations'],
  { revalidate: 60, tags: ['oneentry', 'oneentry-blocks'] }
);

/**
 * getRecommendations — products for a recommendation surface (cart upsell, recently viewed, …).
 *
 * @param   {RecommendationKind} kind   - Recommendation surface.
 * @param   {object}             [opts] - Options.
 * @param   {number}             [opts.excludeId]         - Product id to exclude (e.g. the current product).
 * @param   {number}             [opts.limit]             - Max products (default 8).
 * @param   {boolean}            [opts.fallbackToCatalog] - Use catalog placeholder when empty (default true).
 * @returns Promise resolving to up to `limit` products (empty array on error).
 */
export const getRecommendations = cache(
  async (
    kind: RecommendationKind,
    opts?: { excludeId?: number; limit?: number; fallbackToCatalog?: boolean }
  ): Promise<IProductsEntity[]> =>
    fetchRecommendations(
      kind,
      opts?.excludeId ?? null,
      opts?.limit ?? 8,
      opts?.fallbackToCatalog ?? true,
      getLang()
    )
);
