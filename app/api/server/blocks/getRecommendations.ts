import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api';
import { getProducts } from '@/app/api/server/products/getProducts';
import { BLOCKS } from '@/app/utils/constants';

/** Recommendation surfaces backed by the new OneEntry recommendation Blocks. */
export type RecommendationKind =
  | 'cartComplement'
  | 'recentlyViewed'
  | 'trending'
  | 'personalRecommendations';

const MARKER_BY_KIND: Record<RecommendationKind, string> = {
  cartComplement: BLOCKS.cartComplement,
  recentlyViewed: BLOCKS.recentlyViewed,
  trending: BLOCKS.trending,
  personalRecommendations: BLOCKS.personalRecommendations,
};

/**
 * fetchByKind — dispatches to the matching `Blocks.*` recommendation method.
 *
 * @param   {RecommendationKind} kind   - Recommendation surface.
 * @param   {string}             marker - Block marker for that surface.
 * @param   {string}             lang   - Language code.
 * @returns Promise resolving to the SDK result (`IProductsEntity[]` or `IError`).
 */
const fetchByKind = (kind: RecommendationKind, marker: string, lang: string) => {
  const blocks = getApi().Blocks;
  switch (kind) {
    case 'cartComplement':
      return blocks.getCartComplement(marker, lang);
    case 'recentlyViewed':
      return blocks.getRecentlyViewed(marker, lang);
    case 'trending':
      return blocks.getTrending(marker, lang);
    case 'personalRecommendations':
      return blocks.getPersonalRecommendations(marker, lang);
  }
};

/**
 * getRecommendations — products for a recommendation surface (cart upsell, recently viewed, …).
 *
 * Calls the matching recommendation Block (driven by `UserActivity` signals and the
 * guest/user context). Until the recommendation Blocks are configured in the admin
 * panel (see ONEENTRY-ADMIN-TODO C.2.8) the call returns empty, so as a temporary
 * placeholder it falls back to real catalog products — the surface is never empty and
 * swaps to genuine recommendations automatically once the Blocks exist.
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
  ): Promise<IProductsEntity[]> => {
    const limit = opts?.limit ?? 8;
    const excludeId = opts?.excludeId;
    const lang = getLang();

    try {
      const res = await fetchByKind(kind, MARKER_BY_KIND[kind], lang);
      let items = isError(res) ? [] : (res as IProductsEntity[]);
      if (excludeId != null) {
        items = items.filter(p => p.id !== excludeId);
      }

      if (items.length === 0 && (opts?.fallbackToCatalog ?? true)) {
        const all = await getProducts({ limit: limit + 1, offset: 0, langCode: lang });
        items = (all.products ?? []).filter(p => p.id !== excludeId);
      }

      return items.slice(0, limit);
    } catch {
      return [];
    }
  }
);
