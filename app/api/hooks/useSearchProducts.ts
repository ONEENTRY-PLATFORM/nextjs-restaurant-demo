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
