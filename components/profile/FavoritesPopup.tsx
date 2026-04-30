'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';

import { getImageUrl, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
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
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Placeholder from '@/components/shared/Placeholder';
import Loader from '@/components/shared/Spinner';

import FavoritesPopupAnimations from './animations/FavoritesPopupAnimations';

/**
 * Попап избранного — порт `static-html/pk_favorites.html` (строки 361–470).
 * Модалка по центру на десктопе (соответствует паттерну `Modal` проекта),
 * нижний sheet на мобиле. Управляется через `OpenDrawerContext` (`open` +
 * `component === 'FavoritesPopup'`).
 * @returns {JSX.Element} JSX попапа избранного.
 */
const FavoritesPopup = (): JSX.Element => {
  const { open, component, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'FavoritesPopup';

  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !isOpen || !favoriteIds || favoriteIds.length === 0 },
  );

  const close = () => setTransition('close');
  const products = (data ?? []) as IProductsEntity[];

  return (
    <FavoritesPopupAnimations>
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 min-w-[40vw] right-0 z-20 flex max-h-[90vh] min-h-[60vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 p-5 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-h-[80vh] md:w-auto md:max-w-275 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        <div className="flex justify-end">
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close favorites"
            className="-mt-2.5"
          />
        </div>

        {isLoading ? (
          <div className="mt-15 flex w-full justify-center">
            <Loader />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-5 rounded-xl bg-ink/60 p-6 text-center">
              <p className="text-paper/90">You have no favorites yet.</p>
              <Link
                href="/shop"
                onClick={close}
                className="rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-paper hover:bg-brand-hover"
              >
                Go to shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-15 flex w-full flex-wrap justify-center gap-7.5">
            {products.map((product) => (
              <FavoriteCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <ModalBackdrop />
    </FavoritesPopupAnimations>
  );
};

/**
 * Одиночная карточка избранного — повторяет карточку модалки `pk_favorites.html`.
 * @param   {object}          props         - Пропсы карточки.
 * @param   {IProductsEntity} props.product - Сущность избранного продукта.
 * @returns {JSX.Element}                   JSX карточки.
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
    <div className="flex w-full min-w-92.5 items-center justify-between rounded-[5px] border border-paper/30 p-2.5 md:w-[calc(50%-30px)]">
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

export default FavoritesPopup;
