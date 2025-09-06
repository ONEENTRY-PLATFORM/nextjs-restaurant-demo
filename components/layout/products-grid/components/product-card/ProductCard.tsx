import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type FC, useMemo } from 'react';

import AddToCartButton from '@/components/layout/product/components/AddToCartButton';
import FavoritesButton from '@/components/shared/FavoritesButton';

import CardAnimations from '../../animations/CardAnimations';
import PriceDisplay from './PriceDisplay';
import ProductImage from './ProductImage';
import Stickers from './Stickers';

interface ProductCardProps {
  product: IProductsEntity;
  index: number;
  dict: IAttributeValues;
  pagesLimit: number;
}

/**
 * Product card
 *
 * @param product product entity object
 * @param dict dictionary from server api
 * @param index Index of element for animations stagger
 * @param pagesLimit used for animations
 *
 * @returns Product card
 */
const ProductCard: FC<ProductCardProps> = ({
  product,
  dict,
  index,
  pagesLimit,
}) => {
  const { id, statusIdentifier, attributeValues, localizeInfos } = product;

  const attributes = useMemo(
    () => attributeValues?.['en_US'] || attributeValues,
    [attributeValues],
  );
  const title = useMemo(
    () => localizeInfos?.['en_US']?.title || localizeInfos?.title || '',
    [localizeInfos],
  );
  return (
    <CardAnimations
      className="product-card group"
      index={index}
      pagesLimit={pagesLimit}
    >
      <div className="z-10 flex justify-between gap-5 self-stretch">
        <Stickers product={product} />
        <FavoritesButton {...product} />
      </div>

      {/* ProductImage */}
      <ProductImage attributes={attributes} alt={title} />

      {/* Product Data */}
      <div className="z-10 mb-5 mt-auto flex w-full max-w-[160px] flex-col gap-2.5">
        <h2 className="text-center text-sm leading-4 text-neutral-600">
          {title}
        </h2>

        <PriceDisplay attributes={attributes} />

        <AddToCartButton
          id={id}
          productTitle={title}
          statusIdentifier={statusIdentifier || ''}
          units={attributeValues.units_product.value}
          dict={dict}
          height={42}
          className="btn btn-md btn-primary"
        />
      </div>

      <Link
        prefetch={true}
        href={'/shop/product/' + id}
        className="absolute left-0 top-0 z-0 flex size-full"
      ></Link>
    </CardAnimations>
  );
};

export default ProductCard;
