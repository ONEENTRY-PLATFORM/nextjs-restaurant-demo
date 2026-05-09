import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import CartAddIcon from '@/components/icons/cart-add';
import HeartCardButton from '@/components/layout/products-grid/components/product-card/HeartCardButton';
import { UsePrice } from '@/components/utils';

import CardAnimations from '../../animations/CardAnimations';
import CartButton from './CartButton';
import ProductImage from './ProductImage';

/**
 * ProductCard — product card in the grid.
 * @param   {object}          props               - Component props.
 * @param   {IProductsEntity} props.product       - OneEntry product entity.
 * @param   {number}          props.index         - Index in the grid (for stagger animation).
 * @param   {number}          props.productsLimit - productsLimit for the animation.
 * @returns {JSX.Element}                         Card JSX.
 */
const ProductCard = ({
  product,
  index,
  productsLimit,
}: {
  product: IProductsEntity;
  index: number;
  productsLimit: number;
}): JSX.Element => {
  const { id, attributeValues, localizeInfos } = product;
  const attrs = attributeValues ?? {};
  const title = localizeInfos?.title || '';

  const timeRaw = attrs.cooking_time?.value as string | number | undefined;
  const time = timeRaw != null && timeRaw !== '' ? String(timeRaw) : null;

  const weightRaw = attrs.weight?.value as string | number | undefined;
  const weight = weightRaw != null && weightRaw !== '' ? `${weightRaw} g` : null;

  const ratingRaw = attrs.rating?.value as string | number | undefined;
  const rating = ratingRaw != null && ratingRaw !== '' ? String(ratingRaw) : null;

  const priceValue = (attrs.price?.value ?? product.price) as number | undefined;
  const formattedPrice = priceValue != null ? UsePrice({ amount: priceValue as number }) : null;

  return (
    <CardAnimations className="menu_item group" index={index} productsLimit={productsLimit}>
      <HeartCardButton product={product} />
      <ProductImage attributes={attrs} alt={title} />

      {time || weight || rating ? (
        <div className="descr">
          {time && time !== '0' ? <p> {time} min</p> : null}
          {weight ? <p>{weight}</p> : null}
          {rating ? (
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
          ) : null}
        </div>
      ) : null}

      <p className="menu_item-title">{title}</p>

      <CartButton id={id} title={title}>
        <p className="counter">x1</p>
        <CartAddIcon className="w-5 h-4.75 md:w-7.25 md:h-6.75" />
        {formattedPrice ? <p className="text-base md:text-[22px]">{formattedPrice}</p> : null}
      </CartButton>

      <Link
        prefetch={true}
        href={'/shop/product/' + id}
        className="absolute left-0 top-0 z-0 flex size-full p-0.5"
        aria-label={title}
      />
    </CardAnimations>
  );
};

export default ProductCard;
