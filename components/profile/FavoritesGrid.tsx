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
import Placeholder from '@/components/shared/Placeholder';
import Loader from '@/components/shared/Spinner';

/**
 * Favorites dashboard grid — port of `static-html/pk_favorites.html` modal
 * card grid into a full-width profile page. Renders the user's favorited
 * products as 2-column cards on desktop, single column on mobile.
 * @returns {JSX.Element} Favorites grid JSX.
 */
const FavoritesGrid = (): JSX.Element => {
  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !favoriteIds || favoriteIds.length === 0 },
  );

  const products = (data ?? []) as IProductsEntity[];

  if (isLoading) {
    return <Loader />;
  }

  if (favoriteIds.length === 0 || products.length === 0) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        You have no favorites yet.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-[30px]">
      {products.map((product) => (
        <FavoriteCard key={product.id} product={product} />
      ))}
    </div>
  );
};

/**
 * Single favorite card in the desktop grid — mirrors the modal card from
 * `static-html/pk_favorites.html`: image | title/weight/price | cart + trash
 * action column.
 * @param   {object}          props         - Card props.
 * @param   {IProductsEntity} props.product - Favorited product entity.
 * @returns {JSX.Element}                   Card JSX.
 */
const FavoriteCard = ({
  product,
}: {
  product: IProductsEntity;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const inCart = useAppSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectIsInCart(state as any, product.id),
  );
  const attrs = product.attributeValues ?? {};
  const imageSrc = getImageUrl(
    attrs.cover?.value as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined,
  );
  const title = product.localizeInfos?.title ?? '';
  const weight = attrs.weight?.value as string | number | undefined;
  const priceRaw = (attrs.price?.value ?? product.price) as number | undefined;

  return (
    <div className="flex w-full min-w-[370px] items-center justify-between rounded-[5px] border border-gray-300 p-2.5 md:w-[calc(50%-30px)]">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          width={122}
          height={129}
          sizes="122px"
          className="mr-2.5 shrink-0 object-cover"
        />
      ) : (
        <div className="mr-2.5 flex h-32.25 w-30.5 shrink-0 items-center justify-center">
          <Placeholder />
        </div>
      )}

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
          onClick={() =>
            dispatch(
              addProductToCart({
                id: product.id,
                selected: true,
                quantity: 1,
              }),
            )
          }
          aria-label={inCart ? 'In cart' : 'Add to cart'}
          className="group_white"
          disabled={inCart}
        >
          <CartOrangeIcon />
        </button>
        <button
          type="button"
          onClick={() => dispatch(removeFavorites(product.id))}
          aria-label="Remove from favorites"
          className="group"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export default FavoritesGrid;
