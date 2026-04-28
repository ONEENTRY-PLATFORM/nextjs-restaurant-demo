'use client';

import Image from 'next/image';
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
import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';
import TrashIcon from '@/components/icons/trash';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import Placeholder from '@/components/shared/Placeholder';
import Loader from '@/components/shared/Spinner';

import FavoritesPopupAnimations from './animations/FavoritesPopupAnimations';

/**
 * Favorites drawer popup — port of `static-html/details_favorites.html`
 * favorites overlay, opened from the heart icon in the global header.
 * Mirrors {@link CartPopup} drawer pattern: driven by `OpenDrawerContext`
 * (`open` + `component === 'FavoritesPopup'`), wrapped in slide-in
 * animation + backdrop. On md+ slides in from the right, on mobile fills
 * the bottom sheet.
 * @returns {JSX.Element} Favorites drawer JSX.
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
        className="fixed bottom-0 left-0 right-0 z-20 max-h-[100vh] min-h-[60vh] overflow-y-auto rounded-t-[20px] bg-[rgba(76,77,86,0.8)] px-5 pt-7.25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:max-w-150 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="mx-auto h-full max-w-88.75 overflow-y-auto pb-25 no-scrollbar md:pb-0">
          <div className="mt-2.5 md:flex md:items-center md:justify-between">
            <p className="text-center text-xl font-normal leading-150 text-paper">
              Favorites
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close favorites"
              className="group hidden h-11.5 w-11.5 -mt-2.5 items-center justify-center rounded-full border border-paper hover:border-brand md:flex"
            >
              <CloseXBoldIcon className="hover-target h-3.75 w-3.75" />
            </button>
          </div>

          <div className="flex flex-col">
            {isLoading ? (
              <Loader />
            ) : products.length === 0 ? (
              <p className="mt-5 rounded-xl bg-ink/60 p-6 text-center text-paper/90">
                You have no favorites yet.
              </p>
            ) : (
              products.map((product) => (
                <FavoriteRow key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </div>
      <ModalBackdrop />
    </FavoritesPopupAnimations>
  );
};

/**
 * Single favorite item row — replicates the `details_favorites.html` card.
 * @param   {object}          props         - Row props.
 * @param   {IProductsEntity} props.product - Favorited product entity.
 * @returns {JSX.Element}                   Row JSX.
 */
const FavoriteRow = ({
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
    <div className="mt-5 flex items-center justify-between rounded-[5px] border border-gray-300 p-2.5">
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

      <div className="flex flex-col">
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
