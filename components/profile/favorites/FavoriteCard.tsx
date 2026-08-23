'use client';

import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { toast } from 'react-toastify';

import { getProductCurrency, getProductImageUrl } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { removeFavorites } from '@/app/store/reducers/FavoritesSlice';
import CartOrangeIcon from '@/components/icons/cart-orange';
import TrashIcon from '@/components/icons/trash';
import Placeholder from '@/components/shared/Placeholder';
import { UsePrice } from '@/components/utils';

/**
 * FavoriteCard — single favorite card in the desktop grid.
 *
 * @param   {object}          props         - Component props.
 * @param   {IProductsEntity} props.product - Product entity to render.
 * @returns JSX of the favorite card with add-to-cart and remove buttons.
 */
const FavoriteCard = ({ product }: { product: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(state => selectIsInCart(state, product.id));
  const attrs = product.attributeValues ?? {};
  const imageSrc = getProductImageUrl(attrs);
  const title = product.localizeInfos?.title ?? '';
  const weight = attrs.weight?.value as string | number | undefined;
  const priceRaw = (attrs.price?.value ?? product.price) as number | undefined;
  const currency = getProductCurrency(attrs);

  return (
    <div className="profile-anim-row flex w-full items-center justify-between rounded-card border border-gray-300 p-2.5">
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
          {priceRaw !== undefined ? (
            <p className="favorites_price">{UsePrice({ amount: priceRaw, currency })}</p>
          ) : null}
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
            toast(
              t('product_added_cart_toast', 'Product {title} added to cart!').replace(
                '{title}',
                title
              )
            );
          }}
          aria-label={inCart ? t('in_cart_label', 'In cart') : t('add_to_cart', 'Add to cart')}
          aria-pressed={inCart}
          className={
            inCart
              ? 'group_white is-active flex size-10 items-center justify-center rounded-full bg-brand'
              : 'group_white'
          }
          disabled={inCart}
        >
          <CartOrangeIcon />
        </button>
        <button
          type="button"
          onClick={() => dispatch(removeFavorites(product.id))}
          aria-label={t('remove_from_favorites_label', 'Remove from favorites')}
          className="group"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export default FavoriteCard;
