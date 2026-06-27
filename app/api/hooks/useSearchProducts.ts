'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useEffect, useState } from 'react';

import { getApi, isError } from '@/app/api';

import { trackActivity } from './useTrackActivity';

/**
 * useSearchProducts — product search via the Products API.
 *
 * @param   {object} props      - Hook arguments.
 * @param   {string} props.name - Search query (when empty the hook resets to no products and stops loading).
 * @returns Object `{ loading, products, refetch }` for the current search.
 */
export const useSearchProducts = ({ name }: { name: string }) => {
  // Start in `loading` when `name` is non-empty so the first render does not flash "No products found"
  // before the effect runs.
  const [loading, setLoading] = useState<boolean>(Boolean(name));
  const [products, setProducts] = useState<IProductsEntity[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setProducts([]);
      return;
    }
    setLoading(true);
    setProducts([]);
    let cancelled = false;
    (async () => {
      // Prefer semantic (vector) search; fall back to substring search when it is
      // not configured for the project (error / empty) so behaviour never regresses.
      const vector = await getApi().Products.getProductsByVectorSearch({ queryText: name });
      let result: IProductsEntity[];
      if (!isError(vector) && Array.isArray(vector) && vector.length > 0) {
        result = vector;
      } else {
        // Guard the fallback too — searchProduct may return an IError envelope (not throw),
        // which would crash the `.filter` below if treated as an array.
        const fallback = await getApi().Products.searchProduct(name);
        result = !isError(fallback) && Array.isArray(fallback) ? fallback : [];
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
      setProducts(unique);
      setLoading(false);
      // Feeds search-driven recommendations (UserActivity → recommendation Blocks).
      trackActivity({ type: 'search', query: name });
    })();
    return () => {
      cancelled = true;
    };
  }, [refetch, name]);

  return {
    loading,
    products,
    refetch() {
      setRefetch(!refetch);
    },
  };
};
