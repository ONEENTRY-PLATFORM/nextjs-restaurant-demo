'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useEffect, useState } from 'react';

import { api } from '@/app/api';

/**
 * Search products with Products API
 */
export const useSearchProducts = ({ name }: { name: string }) => {
  // Start in `loading` whenever `name` is non-empty so the first render of a
  // new query never flashes "No products found" before the effect has run.
  const [loading, setLoading] = useState<boolean>(Boolean(name));
  const [products, setProducts] = useState<IProductsEntity[]>([]);
  const [refetch, setRefetch] = useState(false);

  // search products on data change
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
      const result = await api.Products.searchProduct(name);
      if (cancelled) {
        return;
      }
      setProducts(result as IProductsEntity[]);
      setLoading(false);
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
