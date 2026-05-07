'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { useEffect, useState } from 'react';

import { getApi } from '@/app/api';

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
      const result = await getApi().Products.searchProduct(name);
      if (cancelled) {
        return;
      }
      const seen = new Set<number>();
      const unique = (result as IProductsEntity[]).filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      setProducts(unique);
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
