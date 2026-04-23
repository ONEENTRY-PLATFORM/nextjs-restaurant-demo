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
    attrs.pic?.value as
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
    <li className="flex min-w-[370px] w-[calc(50%-16px)] items-center justify-between gap-3 rounded-[5px] border border-gray-300 p-[10px]">
      <div className="relative h-[122px] w-[122px] shrink-0 overflow-hidden rounded-[5px] bg-ink/50">
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
        <div className="flex items-center justify-start gap-[10px]">
          {weight ? <p className="favorites_weight">{weight} g</p> : null}
          {priceRaw !== undefined ? (
            <p className="favorites_price">$ {priceRaw}</p>
          ) : null}
        </div>
      </div>

      <div className="flex h-[122px] shrink-0 flex-col justify-between">
        <button
          type="button"
          onClick={onAddToCart}
          aria-label={inCart ? 'In cart' : 'Add to cart'}
          className="group_white"
          disabled={inCart}
        >
          <svg
            className="hover-target"
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="#ec722b"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21.1047 2.60556C21.0021 2.48534 20.8754 2.38893 20.7332 2.3228C20.5909 2.25668 20.4364 2.22238 20.28 2.22222H5.20478L4.99205 0.928889C4.9497 0.669443 4.81837 0.43371 4.62141 0.263622C4.42445 0.0935341 4.17464 0.000121077 3.91642 0H1.46188C1.17255 0 0.895075 0.117063 0.690491 0.325437C0.485906 0.533811 0.370972 0.816426 0.370972 1.11111C0.370972 1.4058 0.485906 1.68841 0.690491 1.89679C0.895075 2.10516 1.17255 2.22222 1.46188 2.22222H2.99242L5.0215 14.6267L5.1295 14.9322L5.26041 15.1311L5.57459 15.4L5.69677 15.4722C5.82364 15.5262 5.95963 15.5545 6.09714 15.5556H18.0982C18.3875 15.5556 18.665 15.4385 18.8696 15.2301C19.0742 15.0217 19.1891 14.7391 19.1891 14.4444C19.1891 14.1498 19.0742 13.8671 18.8696 13.6588C18.665 13.4504 18.3875 13.3333 18.0982 13.3333H7.02222L6.84113 12.2222H19.1891C19.4516 12.2223 19.7053 12.1259 19.9037 11.9508C20.1021 11.7757 20.2318 11.5336 20.2691 11.2689L21.36 3.49111C21.3821 3.3335 21.3707 3.17289 21.3267 3.02012C21.2827 2.86736 21.207 2.72599 21.1047 2.60556Z"
              fill="#EC722B"
            />
            <path
              d="M7.73459 20C8.63832 20 9.37094 19.2538 9.37094 18.3333C9.37094 17.4129 8.63832 16.6667 7.73459 16.6667C6.83085 16.6667 6.09823 17.4129 6.09823 18.3333C6.09823 19.2538 6.83085 20 7.73459 20Z"
              fill="#EC722B"
            />
            <path
              d="M17.5527 20C18.4565 20 19.1891 19.2538 19.1891 18.3333C19.1891 17.4129 18.4565 16.6667 17.5527 16.6667C16.649 16.6667 15.9164 17.4129 15.9164 18.3333C15.9164 19.2538 16.649 20 17.5527 20Z"
              fill="#EC722B"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from favorites"
          className="group"
        >
          <svg
            className="hover-target"
            width="20"
            height="25"
            viewBox="0 0 20 25"
            fill="#dfe9f9"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.3695 8.33333V22.2222H4.6989V8.33333H15.3695ZM13.3688 0H6.69963L5.36581 1.38889H0.697418V4.16667H19.371V1.38889H14.7026L13.3688 0ZM18.0372 5.55556H2.03124V22.2222C2.03124 23.75 3.23169 25 4.6989 25H15.3695C16.8367 25 18.0372 23.75 18.0372 22.2222V5.55556Z"
              fill="#DFE9F9"
            />
          </svg>
        </button>
      </div>
    </li>
  );
};

export default FavoritesList;
