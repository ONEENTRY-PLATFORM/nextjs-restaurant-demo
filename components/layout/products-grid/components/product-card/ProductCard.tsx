import Image from 'next/image';
import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import CartAddIcon from '@/components/icons/cart-add';
import HeartCardButton from '@/components/shared/HeartCardButton';
import { UsePrice } from '@/components/utils';

import CardAnimations from '../../animations/CardAnimations';
import CartButton from './CartButton';
import ProductImage from './ProductImage';

/**
 * Product card — 1:1 port of `.menu_item` from `static-html/index.html`.
 *
 * Structure (matches mockup exactly):
 *   - `<img>` (ProductImage)
 *   - `<div class="descr">` with `time / weight / rating (★ 5,0)`
 *   - `<p class="menu_item-title">`
 *   - `<div class="menu_items_btn">` with `counter (x1)` + cart SVG + price
 *   - `<svg class="heart_card">` top-right (favorite)
 *   - transparent `<Link>` overlay for click-through to `/shop/product/[id]`
 *
 * Animations preserved via {@link CardAnimations}. Favorites click handled
 * by a separate absolute button layered on top of the full-card link so
 * hearting a product doesn't navigate.
 * @param   {object}          props            - Component props.
 * @param   {IProductsEntity} props.product    - OneEntry product entity.
 * @param   {number}          props.index      - Grid index (for stagger animation).
 * @param   {IAttributeValues} props.dict       - Dictionary (unused — kept for API parity).
 * @param   {number}          props.pagesLimit - Animation pagesLimit.
 * @returns {JSX.Element}                      Card JSX.
 */
const ProductCard = ({
  product,
  index,
  pagesLimit,
}: {
  product: IProductsEntity;
  index: number;
  dict: IAttributeValues;
  pagesLimit: number;
}): JSX.Element => {
  const { id, attributeValues, localizeInfos } = product;
  const attrs = attributeValues ?? {};
  const title = localizeInfos?.title || '';

  // Descr line (time · weight · rating) — markers from `dish` attribute set
  // (verified via inspect-api). Fall back to static-html defaults so the
  // card never looks empty when an attribute is unset.
  const timeRaw = attrs.cooking_time?.value as string | number | undefined;
  const time = timeRaw ? String(timeRaw) : '30-45 min';

  const weightRaw = attrs.weight?.value as string | number | undefined;
  const weight = weightRaw ? `${weightRaw} g` : '250 g';

  const ratingRaw = attrs.rating?.value as string | number | undefined;
  const rating = ratingRaw ? String(ratingRaw) : '5,0';

  // Price
  const priceValue = (attrs.price?.value ?? product.price) as
    | number
    | undefined;
  const formattedPrice = priceValue
    ? UsePrice({ amount: priceValue as number })
    : '$14';

  return (
    <CardAnimations
      className="menu_item group"
      index={index}
      pagesLimit={pagesLimit}
    >
      <ProductImage attributes={attrs} alt={title} />

      <div className="descr">
        <p> {time}</p>
        <p>{weight}</p>
        <div className="rating">
          <Image
            className="rating_img"
            src="/images/icons/Star 16.svg"
            alt="star"
            width={16}
            height={16}
            style={{ width: 'auto', height: 'auto' }}
          />
          <p>{rating}</p>
        </div>
      </div>

      <p className="menu_item-title">{title}</p>

      <CartButton
        id={id}
        title={title}
        units={attrs.units_product?.value as number | undefined}
      >
        <p className="counter">x1</p>
        <CartAddIcon className="w-5 h-4.75 md:w-7.25 md:h-6.75" />
        <p className="text-base md:text-[22px]">{formattedPrice}</p>
      </CartButton>

      <HeartCardButton product={product} />

      <Link
        prefetch={true}
        href={'/shop/product/' + id}
        className="absolute left-0 top-0 z-0 flex size-full"
        aria-label={title}
      />
    </CardAnimations>
  );
};

export default ProductCard;
