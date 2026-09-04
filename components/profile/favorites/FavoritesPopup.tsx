'use client';

import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { useGetProductsByIdsQuery } from '@/app/api/api/RTKApi';
import {
  getProductBlurDataURL,
  getProductCurrency,
  getProductImageUrl,
} from '@/app/api/hooks/useAttributesData';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { removeFavorites, selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import CartOrangeIcon from '@/components/icons/cart-orange';
import TrashIcon from '@/components/icons/trash';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import Placeholder from '@/components/shared/Placeholder';
import Spinner from '@/components/shared/Spinner';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';
import { UsePrice } from '@/components/utils';

const FAVORITE_CARD_SELECTOR = '.favorite-card';

/**
 * FavoritesPopup — favorites popup: centered modal on md+, bottom-sheet on mobile.
 *
 * @returns JSX of the favorites drawer.
 */
const FavoritesPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, transition, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'FavoritesPopup';

  const favoriteIds = useAppSelector(selectFavoritesItems);
  const { data, isLoading } = useGetProductsByIdsQuery(
    { items: favoriteIds },
    { skip: !isOpen || !favoriteIds || favoriteIds.length === 0 }
  );

  const sheetRef = useRef<HTMLDivElement | null>(null);
  // Swipe closes directly - bypass GSAP-reverse so the hook's inline transform does not conflict with the `yPercent` tween.
  useSwipeToClose(sheetRef, () => setOpen(false));
  const favoriteIdSet = new Set(favoriteIds);
  const products = ((data ?? []) as IProductsEntity[]).filter(p => favoriteIdSet.has(p.id));
  const addToCartLabel = t('add_to_cart', 'Add to cart');

  // Click-driven leave.
  const close = (): void => {
    const root = sheetRef.current;
    if (!root) {
      setTransition('close');
      return;
    }
    const targets = root.querySelectorAll(FAVORITE_CARD_SELECTOR);
    if (targets.length === 0) {
      setTransition('close');
      return;
    }
    gsap.to(targets, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.3,
      stagger: { each: 0.05, from: 'end' },
      onComplete: () => setTransition('close'),
    });
  };

  // Backdrop-click fallback
  useEffect(() => {
    if (transition !== 'close' || !sheetRef.current) return;
    const targets = sheetRef.current.querySelectorAll(FAVORITE_CARD_SELECTOR);
    if (targets.length === 0) return;
    gsap.to(targets, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.3,
      stagger: { each: 0.05, from: 'end' },
      overwrite: 'auto',
    });
  }, [transition]);

  return (
    <DrawerAnimations component="FavoritesPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="no-scrollbar fixed inset-x-0 bottom-0 z-20 flex max-h-dvh min-h-[50vh] w-full min-w-[80vw] flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-25 shadow-xl backdrop-blur-card md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:size-auto md:max-h-[80vh] md:max-w-275 md:-translate-1/2 md:rounded-[20px] md:p-10"
      >
        {/* sticky so it does not scroll with the list. Hidden on md+. */}
        <div className="-top-5 z-10 -mx-5 -mt-5 flex items-center justify-center px-5 pt-5 pb-2.5 md:hidden">
          <p className="text-2xl font-normal text-white">{t('favorites_label', 'Favorites')}</p>
        </div>

        {/* Desktop header: spacer / title / X - keeps the title centered. */}
        <div className="hidden items-center justify-between md:flex">
          <span aria-hidden="true" className="size-11.5" />
          <p className="text-2xl font-semibold text-brand">{t('favorites_label', 'Favorites')}</p>
          <ClosePopupButton onClose={close} ariaLabel="Close favorites" />
        </div>

        {isLoading ? (
          <div className="mt-15 flex w-full justify-center">
            <Spinner />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-5 p-6 text-center">
              <p className="text-paper/90">
                {t('no_favorites_text', 'You have no favorites yet.')}
              </p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="rounded-card bg-brand px-3.75 py-1.5 text-base text-paper transition-colors duration-200 hover:bg-brand-hover active:bg-brand-active"
              >
                {t('go_to_shop', 'Go to shop')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex w-full flex-wrap justify-center gap-7.5 md:mt-15">
            {products.map((product, index) => (
              <FavoriteCard
                key={product.id}
                product={product}
                index={index}
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

/**
 * FavoriteCard — single favorite card inside the popup.
 *
 * @param   {object}          props                - Component props.
 * @param   {IProductsEntity} props.product        - Product entity to render.
 * @param   {number}          props.index          - Position in the list; drives the per-card stagger delay on mount.
 * @param   {string}          props.addToCartLabel - Localized label for the add-to-cart aria-label.
 * @param   {() => void}      props.onNavigate     - Callback fired when a card link is followed (closes the popup).
 * @returns JSX of the favorite card row.
 */
const FavoriteCard = ({
  product,
  index,
  addToCartLabel,
  onNavigate,
}: {
  product: IProductsEntity;
  index: number;
  addToCartLabel: string;
  onNavigate: () => void;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(state => selectIsInCart(state, product.id));
  const cardRef = useRef<HTMLDivElement | null>(null);
  const attrs = product.attributeValues ?? {};
  const imageSrc = getProductImageUrl(attrs);
  const blurDataURL = getProductBlurDataURL(attrs);
  const title = product.localizeInfos?.title ?? '';
  const weight = attrs.weight?.value as string | number | undefined;
  const priceRaw = (attrs.price?.value ?? product.price) as number | undefined;
  const currency = getProductCurrency(attrs);

  const productHref = `/shop/product/${product.id}`;

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const tween = gsap.fromTo(
      node,
      { autoAlpha: 0, yPercent: 100 },
      { autoAlpha: 1, yPercent: 0, duration: 0.4, delay: index / 14, overwrite: 'auto' }
    );
    return () => {
      tween.kill();
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="favorite-card relative flex w-full min-w-92.5 items-center justify-between rounded-card border border-paper/30 p-2.5 transition-colors duration-200 hover:border-brand active:border-brand md:w-half-gap"
    >
      <Link
        href={productHref}
        onClick={onNavigate}
        aria-label={title}
        className="flex w-full shrink-0 gap-4"
        title={title}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            width={122}
            height={129}
            sizes="122px"
            className="h-32.25 w-30.5 object-cover"
            {...(blurDataURL ? { placeholder: 'blur' as const, blurDataURL } : {})}
          />
        ) : (
          <div className="flex h-32.25 w-30.5 items-center justify-center">
            <Placeholder />
          </div>
        )}
        <div className="flex flex-col items-start justify-center">
          <p className="favorites_title">{title}</p>
          <div className="flex items-center justify-start gap-2.5">
            {weight ? <p className="favorites_weight">{weight} g</p> : null}
            {priceRaw !== undefined ? (
              <p className="favorites_price">{UsePrice({ amount: priceRaw, currency })}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="absolute right-2 flex h-30.5 shrink-0 flex-col justify-between">
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
            toast(
              t('product_added_cart_toast', 'Product {title} added to cart!').replace(
                '{title}',
                title
              )
            );
          }}
          aria-label={inCart ? t('in_cart_label', 'In cart') : addToCartLabel}
          className="group_white"
          disabled={inCart}
          title={inCart ? t('in_cart_label', 'In cart') : addToCartLabel}
        >
          <CartOrangeIcon />
        </button>
        <button
          type="button"
          onClick={() => dispatch(removeFavorites(product.id))}
          aria-label={t('remove_from_favorites_label', 'Remove from favorites')}
          className="group"
          title={t('remove_from_favorites_label', 'Remove from favorites')}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export default FavoritesPopup;
