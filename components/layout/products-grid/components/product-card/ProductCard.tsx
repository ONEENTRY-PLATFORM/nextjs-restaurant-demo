import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import AddToCartButton from '@/components/layout/product/components/AddToCartButton';
import FavoritesButton from '@/components/shared/FavoritesButton';

import CardAnimations from '../../animations/CardAnimations';
import PriceDisplay from './PriceDisplay';
import ProductImage from './ProductImage';
import Stickers from './Stickers';

/**
 * Product card
 */
const ProductCard = ({
  product,
  dict,
  index,
  pagesLimit,
}: {
  product: IProductsEntity;
  index: number;
  dict: IAttributeValues;
  pagesLimit: number;
}): JSX.Element => {
  const { id, statusIdentifier, attributeValues, localizeInfos } = product;

  const attributes = attributeValues;
  const title = localizeInfos?.title || '';
  return (
    <CardAnimations
      className="menu_item group"
      index={index}
      pagesLimit={pagesLimit}
    >
      {/* Stickers (top-left) + Favorites heart (top-right) */}
      <div className="z-10 flex justify-between items-start gap-2 self-stretch">
        <Stickers product={product} />
        <div className="heart_card">
          <FavoritesButton {...product} />
        </div>
      </div>

      {/* ProductImage */}
      <ProductImage attributes={attributes} alt={title} />

      {/* Price strip overlaying image bottom */}
      <div className="descr">
        <PriceDisplay attributes={attributes} />
      </div>

      {/* Product Data */}
      <div className="z-10 flex flex-col gap-2.5 px-1">
        <h3 className="menu_item-title">{title}</h3>
        <AddToCartButton
          id={id}
          productTitle={title}
          statusIdentifier={statusIdentifier || ''}
          units={(attributeValues.units_product?.value as number) ?? 0}
          dict={dict}
          height={46}
          className="bg-brand hover:bg-brand-hover w-[46px] h-[46px] flex justify-center items-center rounded-full mt-[-10px] relative text-white font-bold text-2xl leading-none"
        />
      </div>

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
