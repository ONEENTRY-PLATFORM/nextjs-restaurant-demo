'use client';

import type { JSX } from 'react';

import { useGetProductsByIdsQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import ProductCard from '@/components/layout/products-grid/components/product-card/ProductCard';

/**
 * Favorites list — reads the favorite product IDs from Redux and fetches
 * their full product entities via RTK Query, rendering them as a grid of
 * {@link ProductCard}.
 * @returns {JSX.Element} Favorites grid JSX.
 */
const FavoritesList = (): JSX.Element => {
  const favoriteIds = useAppSelector(
    (state: { favoritesReducer: { products: number[] } }) =>
      selectFavoritesItems(state),
  );

  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !favoriteIds || favoriteIds.length === 0 },
  );

  if (!favoriteIds || favoriteIds.length === 0) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        You have no favorites yet.
      </div>
    );
  }
  if (isLoading) {
    return <div className="text-paper/80">Loading...</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        Favorites not available.
      </div>
    );
  }

  return (
    <div className="menu_items">
      {data.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          dict={{}}
          index={index}
          pagesLimit={data.length}
        />
      ))}
    </div>
  );
};

export default FavoritesList;
