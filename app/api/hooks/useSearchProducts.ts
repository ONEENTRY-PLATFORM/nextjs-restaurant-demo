'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useEffect, useState } from 'react';

import { api } from '@/app/api';

/**
 * Поиск продуктов через Products API.
 */
export const useSearchProducts = ({ name }: { name: string }) => {
  // Стартуем в `loading`, когда `name` непустое, чтобы первый рендер нового
  // запроса не мигал "No products found" до того, как effect отработал.
  const [loading, setLoading] = useState<boolean>(Boolean(name));
  const [products, setProducts] = useState<IProductsEntity[]>([]);
  const [refetch, setRefetch] = useState(false);

  // ищем продукты при изменении данных
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
