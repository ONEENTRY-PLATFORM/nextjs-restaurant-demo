'use client';

import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getImageUrl, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addProductToCart,
  selectIsInCart,
} from '@/app/store/reducers/CartSlice';
import {
  removeFavorites,
  selectFavoritesItems,
} from '@/app/store/reducers/FavoritesSlice';
import CartOrangeIcon from '@/components/icons/cart-orange';
import TrashIcon from '@/components/icons/trash';

/**
 * Favorites list — row-layout per `pk_favorites.html`: image + title +
 * weight/price + "add to cart" and "delete" icons on the right.
 *
 * Reads favorite product IDs from Redux and fetches full entities via RTK
 * Query. Gracefully degrades to empty state if nothing is favorited or the
 * products API is unreachable.
 * @returns {JSX.Element} Favorites rows JSX.
 */
const FavoritesList = (): JSX.Element => {
  const dispatch = useAppDispatch();
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
    <ul className="flex flex-wrap gap-4">
      {data.map((product) => (
        <FavoriteRow
          key={product.id}
          product={product}
          onRemove={() => dispatch(removeFavorites(product.id))}
          onAddToCart={() =>
            dispatch(
              addProductToCart({
                id: product.id,
                selected: true,
                quantity: 1,
              }),
            )
          }
        />
      ))}
    </ul>
  );
};

type FavoriteRowProps = {
  product: IProductsEntity;
  onRemove: () => void;
  onAddToCart: () => void;
};

/**
 * Single favorite item row — replicates the `pk_favorites.html` card.
 * @param   {FavoriteRowProps} props - Row props.
 * @returns {JSX.Element}            Row JSX.
 */
const FavoriteRow = ({
  product,
  onRemove,
  onAddToCart,
}: FavoriteRowProps): JSX.Element => {
  const inCart = useAppSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectIsInCart(state as any, product.id),
  );
  const attrs = product.attributeValues ?? {};
  const imageSrc = getImageUrl(
    (attrs.cover?.value ?? attrs.pic?.value) as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined,
  );
  const title = product.localizeInfos?.title ?? '';
  const weight = (attrs.weight?.value ?? attrs.portion?.value) as
    | string
    | number
    | undefined;
  const priceRaw = (attrs.price?.value ?? product.price) as number | undefined;

  return (
    <li className="flex min-w-92.5 w-[calc(50%-16px)] items-center justify-between gap-3 rounded-[5px] border border-paper/40 p-2.5">
      <div className="relative h-30.5 w-30.5 shrink-0 overflow-hidden rounded-[5px] bg-ink/50">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="122px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex w-1/2 flex-col">
        <p className="favorites_title">{title}</p>
        <div className="flex items-center justify-start gap-2.5">
          {weight ? <p className="favorites_weight">{weight} g</p> : null}
          {priceRaw !== undefined ? (
            <p className="favorites_price">$ {priceRaw}</p>
          ) : null}
        </div>
      </div>

      <div className="flex h-30.5 shrink-0 flex-col justify-between">
        <button
          type="button"
          onClick={onAddToCart}
          aria-label={inCart ? 'In cart' : 'Add to cart'}
          className="group_white"
          disabled={inCart}
        >
          <CartOrangeIcon />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from favorites"
          className="group"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
};

export default FavoritesList;
