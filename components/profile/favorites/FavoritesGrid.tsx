'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useGetProductsByIdsQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import Spinner from '@/components/shared/Spinner';

import FavoriteCard from './FavoriteCard';

/**
 * FavoritesGrid — favorites grid on the profile dashboard.
 *
 * @returns JSX of the favorites grid (loader, empty state, or list of `FavoriteCard` entries).
 */
const FavoritesGrid = (): JSX.Element => {
  const t = useT();
  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !favoriteIds || favoriteIds.length === 0 }
  );

  const favoriteIdSet = new Set(favoriteIds);
  const products = ((data ?? []) as IProductsEntity[]).filter(p => favoriteIdSet.has(p.id));

  if (isLoading) {
    return <Spinner />;
  }

  if (favoriteIds.length === 0 || products.length === 0) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        {t('no_favorites_text', 'You have no favorites yet.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {products.map(product => (
        <FavoriteCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default FavoritesGrid;
