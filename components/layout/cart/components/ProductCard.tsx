import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { deselectProduct } from '@/app/store/reducers/CartSlice';
import Placeholder from '@/components/shared/Placeholder';

import QuantitySelector from '../../product/components/QuantitySelector';
import ProductAnimations from '../animations/ProductAnimations';
import DeleteButton from './DeleteButton';
import PriceDisplay from './PriceDisplay';

/**
 * Product card in cart
 */
const ProductCard = ({
  product,
  selected,
  index,
}: {
  product: IProductsEntity;
  selected: boolean;
  index: number;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  // extract data from product
  const {
    id,
    attributeValues: { pic, price, sale, units_product },
    localizeInfos,
  } = product;
  const imgSrc = (pic?.value as { downloadLink?: string } | undefined)
    ?.downloadLink;
  const title = localizeInfos?.title ?? '';

  return (
    <ProductAnimations
      className="product-in-cart"
      product={product}
      index={index}
    >
      <div className="relative flex justify-between gap-5">
        <div className="relative z-10 mb-auto box-border flex shrink-0 flex-row self-center overflow-hidden rounded-md">
          <input
            onChange={() => {
              dispatch(deselectProduct(id));
            }}
            type="checkbox"
            name={'deselectProduct-' + id}
            id={'deselectProduct-' + id}
            checked={selected}
            className="size-5 border-spacing-3 accent-orange-500 ring-2 ring-orange-700"
          />
        </div>

        <div className="relative h-17.25 w-17.25 shrink-0">
          {imgSrc ? (
            <Image
              width={69}
              height={69}
              loading="lazy"
              src={imgSrc}
              alt={title}
              className="size-full shrink-0 self-start object-cover"
            />
          ) : (
            <Placeholder />
          )}
        </div>

        <div className="flex flex-col gap-2 self-start text-white/90">
          <h2 className="font-normal text-[14px] max-w-35">{title}</h2>
          <PriceDisplay
            currentPrice={(sale?.value as number) ?? 0}
            originalPrice={(price?.value as number) ?? 0}
          />
        </div>

        <Link
          prefetch={true}
          href={`/shop/product/` + id}
          className="absolute left-0 top-0 z-0 flex size-full"
        ></Link>
      </div>
      <div className="z-10 flex items-center gap-3.75 self-start text-white/90 max-sm:ml-8 max-sm:flex">
        <QuantitySelector
          id={id}
          units={(units_product?.value as number) ?? 0}
          title={title}
          height={42}
        />
        <DeleteButton productId={id} />
      </div>
    </ProductAnimations>
  );
};

export default ProductCard;
