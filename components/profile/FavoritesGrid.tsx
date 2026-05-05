'use client';

import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { toast } from 'react-toastify';

import { getImageUrl, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { removeFavorites, selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import CartOrangeIcon from '@/components/icons/cart-orange';
import TrashIcon from '@/components/icons/trash';
import Placeholder from '@/components/shared/Placeholder';
import Loader from '@/components/shared/Spinner';

/**
 * Сетка избранного в дашборде — порт сетки карточек модалки
 * `static-html/pk_favorites.html`. На странице `/profile/favorites`
 * @returns {JSX.Element} JSX сетки избранного.
 */
const FavoritesGrid = (): JSX.Element => {
  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !favoriteIds || favoriteIds.length === 0 }
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
    <div className="flex flex-col gap-4">
      {products.map(product => (
        <FavoriteCard key={product.id} product={product} />
      ))}
    </div>
  );
};

/**
 * Одиночная карточка избранного в десктоп-сетке — повторяет карточку модалки
 * из `static-html/pk_favorites.html`: изображение | название/вес/цена |
 * колонка действий с корзиной и корзиной для мусора.
 * @param   {object}          props         - Пропсы карточки.
 * @param   {IProductsEntity} props.product - Сущность избранного продукта.
 * @returns {JSX.Element}                   JSX карточки.
 */
const FavoriteCard = ({ product }: { product: IProductsEntity }): JSX.Element => {
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(state => selectIsInCart(state, product.id));
  const attrs = product.attributeValues ?? {};
  const imageSrc = getImageUrl(
    attrs.cover?.value as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined
  );
  const title = product.localizeInfos?.title ?? '';
  const weight = attrs.weight?.value as string | number | undefined;
  const priceRaw = (attrs.price?.value ?? product.price) as number | undefined;

  return (
    <div className="flex w-full items-center justify-between rounded-[5px] border border-gray-300 p-2.5">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          width={122}
          height={129}
          sizes="122px"
          className="mr-2.5 h-32.25 w-30.5 shrink-0 object-cover"
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
          {priceRaw !== undefined ? <p className="favorites_price">$ {priceRaw}</p> : null}
        </div>
      </div>

      <div className="flex h-30.5 shrink-0 flex-col justify-between">
        <button
          type="button"
          onClick={() => {
            dispatch(
              addProductToCart({
                id: product.id,
                selected: true,
                quantity: 1,
              })
            );
            toast('Product ' + title + ' added to cart!');
          }}
          aria-label={inCart ? 'In cart' : 'Add to cart'}
          aria-pressed={inCart}
          // Когда товар уже в корзине — кнопка показывается как
          // «нажатая»: brand-circle + белая иконка (зеркалит hover-state
          // через `.group_white.is-active` в `app/styles/main.css`).
          className={
            inCart
              ? 'group_white is-active flex h-10 w-10 items-center justify-center rounded-full bg-brand'
              : 'group_white'
          }
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
