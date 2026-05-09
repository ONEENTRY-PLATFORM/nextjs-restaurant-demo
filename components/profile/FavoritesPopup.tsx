'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useRef } from 'react';
import { toast } from 'react-toastify';

import { getImageUrl, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { removeFavorites, selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import ArrowBackOrangeIcon from '@/components/icons/arrow-back-orange';
import BurgerOrangeIcon from '@/components/icons/burger-orange';
import CartOrangeIcon from '@/components/icons/cart-orange';
import TrashIcon from '@/components/icons/trash';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Placeholder from '@/components/shared/Placeholder';
import Loader from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/** FavoritesPopup — попап избранного: модалка по центру на md+, bottom-sheet на мобиле. */
const FavoritesPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'FavoritesPopup';

  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !isOpen || !favoriteIds || favoriteIds.length === 0 }
  );

  const close = () => setTransition('close');
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Свайп закрывает напрямую — минуем GSAP-reverse, чтобы inline-transform хука не конфликтовал с `yPercent`-tween.
  useSwipeToClose(sheetRef, () => setOpen(false));
  const favoriteIdSet = new Set(favoriteIds);
  const products = ((data ?? []) as IProductsEntity[]).filter(p => favoriteIdSet.has(p.id));
  const addToCartLabel = t('add_to_cart', 'Add to cart');

  return (
    <DrawerAnimations component="FavoritesPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 min-w-[80vw] min-h-[50vh] right-0 z-20 flex w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-h-[80vh] md:w-auto md:max-w-275 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        {/* Мобильный хедер: back / title / burger; sticky чтобы не уезжал со списком. На md+ скрыт. */}
        <div className="sticky -mx-5 -mt-5 -top-5 z-10 flex items-center justify-between px-5 pt-5 pb-2.5 md:hidden">
          <button
            type="button"
            onClick={close}
            aria-label="Close favorites"
            className="group_white"
          >
            <ArrowBackOrangeIcon />
          </button>
          <p className="font-normal text-[24px] text-white">Favorites</p>
          <button type="button" onClick={close} aria-label="Menu" className="group_white">
            <BurgerOrangeIcon />
          </button>
        </div>

        {/* Десктоп-хедер: spacer / title / X — выравнивание заголовка по центру. */}
        <div className="hidden items-center justify-between md:flex">
          <span aria-hidden="true" className="h-11.5 w-11.5" />
          <p className="font-semibold text-[24px] text-brand">Favorites</p>
          <ClosePopupButton onClose={close} ariaLabel="Close favorites" />
        </div>

        {isLoading ? (
          <div className="mt-15 flex w-full justify-center">
            <Loader />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-5 p-6 text-center">
              <p className="text-paper/90">You have no favorites yet.</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-paper hover:bg-brand-hover"
              >
                Go to shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-15 flex w-full flex-wrap justify-center gap-7.5">
            {products.map(product => (
              <FavoriteCard
                key={product.id}
                product={product}
                addToCartLabel={addToCartLabel}
                onNavigate={close}
              />
            ))}
          </div>
        )}
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

/** FavoriteCard — одиночная карточка избранного в попапе. */
const FavoriteCard = ({
  product,
  addToCartLabel,
  onNavigate,
}: {
  product: IProductsEntity;
  addToCartLabel: string;
  onNavigate: () => void;
}): JSX.Element => {
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

  const productHref = `/shop/product/${product.id}`;

  return (
    <div className="flex w-full min-w-92.5 items-center justify-between rounded-[5px] border border-paper/30 p-2.5 md:w-half-gap">
      <Link href={productHref} onClick={onNavigate} aria-label={title} className="mr-2.5 shrink-0">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            width={122}
            height={129}
            sizes="122px"
            className="h-32.25 w-30.5 object-cover"
          />
        ) : (
          <div className="flex h-32.25 w-30.5 items-center justify-center">
            <Placeholder />
          </div>
        )}
      </Link>

      <Link href={productHref} onClick={onNavigate} className="flex w-1/2 flex-col">
        <p className="favorites_title">{title}</p>
        <div className="flex items-center justify-start gap-2.5">
          {weight ? <p className="favorites_weight">{weight} g</p> : null}
          {priceRaw !== undefined ? <p className="favorites_price">$ {priceRaw}</p> : null}
        </div>
      </Link>

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
          aria-label={inCart ? 'In cart' : addToCartLabel}
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
