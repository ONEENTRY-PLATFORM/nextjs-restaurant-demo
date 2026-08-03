'use client';

import type {
  IProductSearchResult,
  IProductsEntity,
} from 'oneentry/dist/products/productsInterfaces';
import { useEffect, useState } from 'react';

import { getApi, isError } from '@/app/api';

import { trackActivity } from './useTrackActivity';

/**
 * isFullProducts — narrows the `searchProduct` union to full product entities.
 *
 * Checks the first element for `attributeValues` (short `IProductSearchResult` cards carry only
 * `{ id, title, pageId }`); an empty array counts as full.
 *
 * @param   {IProductsEntity[] | IProductSearchResult[]} arr - Result array from `Products.searchProduct`.
 * @returns `true` when the array holds full `IProductsEntity` items.
 */
const isFullProducts = (
  arr: IProductsEntity[] | IProductSearchResult[]
): arr is IProductsEntity[] => {
  const first = arr[0];
  return first === undefined || 'attributeValues' in first;
};

/** Stable empty result — a fresh `[]` each render would break memo consumers. */
const EMPTY_PRODUCTS: IProductsEntity[] = [];

/**
 * useSearchProducts — product search via the Products API.
 *
 * @param   {object} props      - Hook arguments.
 * @param   {string} props.name - Search query (when empty the hook resets to no products and stops loading).
 * @returns Object `{ loading, products, refetch }` for the current search.
 */
export const useSearchProducts = ({ name }: { name: string }) => {
  const [attempt, setAttempt] = useState(0);
  /**
   * Results are stored together with the request they answer, so "still
   * loading" is derived by comparing keys instead of being written into state
   * synchronously from the effect body (which would cascade re-renders).
   */
  const [result, setResult] = useState<{ key: string; products: IProductsEntity[] }>({
    key: '',
    products: EMPTY_PRODUCTS,
  });

  /** Identity of the request the current arguments ask for. */
  const requestKey = name ? `${attempt}|${name}` : '';

  useEffect(() => {
    if (!name) {
      // Nothing to fetch: the empty-query result is derived at return time.
      return;
    }
    let cancelled = false;
    (async () => {
      // Prefer semantic (vector) search; fall back to substring search when it is
      // not configured for the project (error / empty) so behaviour never regresses.
      const vector = await getApi().Products.getProductsByVectorSearch({ queryText: name });
      // The endpoint answers with a container (`{ items, total }`), not a bare list.
      const vectorItems = isError(vector) ? [] : vector.items;
      let result: IProductsEntity[];
      if (vectorItems.length > 0) {
        result = vectorItems;
      } else {
        const fallback = await getApi().Products.searchProduct(name);
        if (isError(fallback) || !Array.isArray(fallback)) {
          result = [];
        } else if (isFullProducts(fallback)) {
          result = fallback;
        } else {
          // traficLimit mode returns short cards — hydrate them into full entities
          // so consumers keep receiving `IProductsEntity[]`.
          const full = await getApi().Products.getProductsByIds(fallback.map(p => p.id).join(','));
          result = !isError(full) && Array.isArray(full) ? full : [];
        }
      }
      if (cancelled) {
        return;
      }
      const seen = new Set<number>();
      const unique = result.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      // The only state write of the hook, and it happens after `await` —
      // never synchronously inside the effect body.
      setResult({ key: requestKey, products: unique });
      trackActivity({ type: 'search', query: name });
    })();
    return () => {
      cancelled = true;
    };
  }, [requestKey, name]);

  /**
   * Both outputs are derived: a non-empty query is "loading" until the stored
   * result carries its own key, and results from a previous query are never
   * shown for the current one. An empty query has no results and never loads.
   */
  const isCurrent = result.key === requestKey;
  return {
    loading: Boolean(name) && !isCurrent,
    products: isCurrent ? result.products : EMPTY_PRODUCTS,
    refetch() {
      setAttempt(value => value + 1);
    },
  };
};
