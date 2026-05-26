import Image from 'next/image';
import Link from 'next/link';
import type { IOrderProducts } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProductImageUrl } from '@/app/api';
import { UsePrice } from '@/components/utils';

/**
 * OrderLineItem — single line-item row inside the expanded order body.
 *
 * @param   {object}                       props             - Component props.
 * @param   {IOrderProducts}               props.product     - Order line-item entity.
 * @param   {boolean}                      props.first       - Whether this is the first row (drops the top margin).
 * @param   {IProductsEntity | undefined}  [props.fullProduct] - Optional full product entity used to resolve a fallback image.
 * @returns JSX of the line-item row.
 */
const OrderLineItem = ({
  product,
  first,
  fullProduct,
}: {
  product: IOrderProducts;
  first: boolean;
  fullProduct?: IProductsEntity | undefined;
}): JSX.Element => {
  const fallbackFromEntity = getProductImageUrl(fullProduct?.attributeValues);
  const previewSrc = product.previewImage?.previewLink ?? fallbackFromEntity ?? null;
  const href = '/shop/product/' + product.id;
  return (
    <div className={'order-body-row' + (first ? '' : ' mt-5')}>
      <div className="flex items-center justify-between gap-3.75">
        <Link href={href} aria-label={product.title} className="shrink-0">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={product.title}
              width={69}
              height={69}
              className="h-17.25 w-17.25 object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-17.25 w-17.25 shrink-0 rounded bg-custom_gray_pk"
            />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <Link
            href={href}
            className="text-sm font-normal text-white transition-colors duration-200 hover:text-brand"
          >
            {product.title}
          </Link>
          <div className="flex items-center gap-2.5">
            <p className="text-xl font-bold text-brand">{UsePrice({ amount: product.price })}</p>
          </div>
        </div>
        <div className="flex h-11.25 w-8.75 items-center justify-center rounded-card border border-white text-base font-normal text-white">
          x{product.quantity}
        </div>
      </div>
    </div>
  );
};

export default OrderLineItem;
