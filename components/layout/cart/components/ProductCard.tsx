import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getProductCurrency, getProductImageUrl } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { useOutOfStockMarker } from '@/app/store/providers/ProductStatusContext';
import { deselectProduct } from '@/app/store/reducers/CartSlice';
import Placeholder from '@/components/shared/Placeholder';

import ProductAnimations from '../animations/ProductAnimations';
import CartQuantityControl from './CartQuantityControl';
import DeleteButton from './DeleteButton';
import PriceDisplay from './PriceDisplay';

/**
 * ProductCard — cart-row card for a single product (image, title, price, qty controls, delete).
 *
 * @param   {object}            props          - Component props.
 * @param   {IProductsEntity}   props.product  - OneEntry product entity rendered in the row.
 * @param   {boolean}           props.selected - Whether the row is in the selection state (controls checkbox/visual highlight).
 * @param   {number}            props.index    - Zero-based row index, used by `ProductAnimations` for staggered reveal.
 * @returns JSX of the cart product row.
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
  const t = useT();
  const dispatch = useAppDispatch();
  const outOfStockMarker = useOutOfStockMarker();
  const {
    id,
    attributeValues: { price, sale, units_product, weight },
    localizeInfos,
  } = product;
  const imgSrc = getProductImageUrl(product.attributeValues);
  const currency = getProductCurrency(product.attributeValues);
  const title = localizeInfos?.title ?? '';
  const weightValue = weight?.value as string | number | undefined;
  const outOfStock = product.statusIdentifier === outOfStockMarker;
  const checkboxChecked = selected && !outOfStock;

  return (
    <ProductAnimations
      className="product-in-cart relative flex items-center justify-between gap-2.5 rounded-card border border-transparent p-2.5 transition-colors duration-200 hover:border-brand active:border-brand"
      product={product}
      index={index}
    >
      <Link
        href={'/shop/product/' + id}
        aria-label={title}
        className="absolute inset-0 z-0 rounded-card"
      />

      <div className="pointer-events-none relative z-10 flex items-center gap-2.5">
        <input
          onChange={() => dispatch(deselectProduct(id))}
          type="checkbox"
          name={'deselectProduct-' + id}
          id={'deselectProduct-' + id}
          checked={checkboxChecked}
          disabled={outOfStock}
          aria-label={
            outOfStock
              ? t('out_of_stock_aria_template', '{title} is out of stock').replace('{title}', title)
              : t('select_item_aria_template', 'Select {title}').replace('{title}', title)
          }
          className="pointer-events-auto size-5 shrink-0 accent-brand disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="pointer-events-none relative size-17.25 shrink-0 overflow-hidden rounded">
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
        </div>

        <div className="pointer-events-none flex grow flex-col justify-between gap-2 self-center text-white/90">
          <h2 className="max-w-35 text-[14px] font-normal opacity-90">{title}</h2>
          <div className="flex items-center gap-2.5">
            {weightValue ? (
              <p className="text-[14px] font-normal text-brand">{weightValue} g</p>
            ) : null}
            <PriceDisplay
              currentPrice={(sale?.value as number) ?? 0}
              originalPrice={(price?.value as number) ?? 0}
              currency={currency}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative z-10 flex shrink-0 items-center gap-3.75">
        <div className="pointer-events-auto">
          <DeleteButton productId={id} title={title} />
        </div>
        <div className="pointer-events-auto">
          <CartQuantityControl
            id={id}
            units={(units_product?.value as number) ?? 0}
            title={title}
          />
        </div>
      </div>
    </ProductAnimations>
  );
};

export default ProductCard;
