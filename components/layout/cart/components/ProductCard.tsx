import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { deselectProduct } from '@/app/store/reducers/CartSlice';
import Placeholder from '@/components/shared/Placeholder';

import ProductAnimations from '../animations/ProductAnimations';
import CartQuantityControl from './CartQuantityControl';
import DeleteButton from './DeleteButton';
import PriceDisplay from './PriceDisplay';

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
  const {
    id,
    attributeValues: { pic, cover, price, sale, units_product, weight },
    localizeInfos,
  } = product;
  const imageAttr = (cover?.value ?? pic?.value) as
    | { downloadLink?: string }
    | undefined;
  const imgSrc = imageAttr?.downloadLink;
  const title = localizeInfos?.title ?? '';
  const weightValue = weight?.value as string | number | undefined;

  return (
    <ProductAnimations
      className="product-in-cart flex items-center justify-between gap-2.5 p-2.5 hover:rounded-[5px] hover:border hover:border-brand"
      product={product}
      index={index}
    >
      <div className="flex items-center gap-2.5">
        <input
          onChange={() => dispatch(deselectProduct(id))}
          type="checkbox"
          name={'deselectProduct-' + id}
          id={'deselectProduct-' + id}
          checked={selected}
          className="size-5 shrink-0 accent-brand"
        />

        <Link
          prefetch={true}
          href={'/shop/product/' + id}
          className="relative size-17.25 shrink-0 overflow-hidden rounded"
          aria-label={title}
        >
          {imgSrc ? (
            <Image
              width={69}
              height={69}
              loading="lazy"
              src={imgSrc}
              alt={title}
              className="size-full object-cover"
            />
          ) : (
            <Placeholder />
          )}
        </Link>

        <div className="flex flex-col justify-between gap-2 self-center text-white/90">
          <h2 className="max-w-35 font-normal text-[14px] opacity-90">
            {title}
          </h2>
          <div className="flex items-center gap-2.5">
            {weightValue ? (
              <p className="font-normal text-[14px] text-brand">
                {weightValue} g
              </p>
            ) : null}
            <PriceDisplay
              currentPrice={(sale?.value as number) ?? 0}
              originalPrice={(price?.value as number) ?? 0}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3.75">
        <DeleteButton productId={id} />
        <CartQuantityControl
          id={id}
          units={(units_product?.value as number) ?? 0}
          title={title}
        />
      </div>
    </ProductAnimations>
  );
};

export default ProductCard;
