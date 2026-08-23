import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getProductCurrency } from '@/app/api';
import CartAddIcon from '@/components/icons/cart-add';
import HeartCardButton from '@/components/layout/products-grid/components/product-card/HeartCardButton';
import { UsePrice } from '@/components/utils';

import CardAnimations from '../../animations/CardAnimations';
import CartButton from './CartButton';
import ProductImage from './ProductImage';

/**
 * Placeholder rating shown until a product's real rating is formed. OneEntry's
 * native `product.rating` is empty for every product so far (rating not yet
 * formed), but the mockup shows a rating on every card. Swap-in is automatic
 * once `product.rating.value` is populated.
 */
const PLACEHOLDER_RATING = '5.0';

/**
 * ProductCard — product card in the catalog grid.
 *
 * @param   {object}            props               - Component props.
 * @param   {IProductsEntity}   props.product       - OneEntry product entity.
 * @param   {number}            props.index         - Card index in the grid (drives the stagger animation).
 * @param   {number}            props.productsLimit - Page size used by the stagger to reset on a new page.
 * @param   {string}            [props.blurDataURL] - Optional base64 LQIP for the cover (forwarded to {@link ProductImage}).
 * @returns JSX of the product card with image, meta, cart button, and link overlay.
 */
const ProductCard = ({
  product,
  index,
  productsLimit,
  blurDataURL,
}: {
  product: IProductsEntity;
  index: number;
  productsLimit: number;
  blurDataURL?: string;
}): JSX.Element => {
  const { id, attributeValues, localizeInfos } = product;
  const attrs = attributeValues ?? {};
  const title = localizeInfos?.title || '';

  const timeRaw = attrs.cooking_time?.value as string | number | undefined;
  const time = timeRaw != null && timeRaw !== '' ? String(timeRaw) : null;

  const weightRaw = attrs.weight?.value as string | number | undefined;
  const weight = weightRaw != null && weightRaw !== '' ? `${weightRaw} g` : null;

  // Aggregate rating from the entity (top-level `rating`, not attributeValues).
  // Falls back to a placeholder while OneEntry has no real rating (see PLACEHOLDER_RATING).
  const ratingValue = product.rating?.value;
  const rating = ratingValue != null ? String(ratingValue) : PLACEHOLDER_RATING;

  const priceValue = (attrs.price?.value ?? product.price) as number | undefined;
  const currency = getProductCurrency(attrs);
  const formattedPrice =
    priceValue != null ? UsePrice({ amount: priceValue as number, currency }) : null;

  return (
    <CardAnimations className="menu_item group" index={index} productsLimit={productsLimit}>
      <HeartCardButton product={product} />
      <ProductImage attributes={attrs} alt={title} {...(blurDataURL ? { blurDataURL } : {})} />

      <div className="descr">
        {time && time !== '0' ? <p> {time} min</p> : null}
        {weight ? <p>{weight}</p> : null}
        <div className="rating">
          <Image
            className="rating_img"
            src="/images/icons/star.svg"
            alt="star"
            width={16}
            height={16}
            loading="eager"
            style={{ width: 'auto', height: 'auto' }}
          />
          <p>{rating}</p>
        </div>
      </div>

      <p className="menu_item-title">{title}</p>

      <CartButton id={id} title={title}>
        <p className="counter">x1</p>
        <CartAddIcon className="h-4.75 w-5 md:h-6.75 md:w-7.25" />
        {formattedPrice ? <p className="text-base md:text-[22px]">{formattedPrice}</p> : null}
      </CartButton>

      <Link
        href={'/shop/product/' + id}
        prefetch={false}
        className="absolute top-0 left-0 z-0 flex size-full p-px"
        aria-label={title}
      />
    </CardAnimations>
  );
};

export default ProductCard;
