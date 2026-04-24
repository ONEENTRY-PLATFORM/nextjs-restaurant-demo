import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import AddToCartButton from '../components/AddToCartButton';
import PriceDisplay from '../components/PriceDisplay';
import ProductUnits from './ProductUnits';

/**
 * Product details component
 */
const ProductDetails = async ({
  product,
  dict,
}: {
  product: IProductsEntity & { productPages?: [] };
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
  // Extract data from product
  const {
    id,
    statusIdentifier,
    localizeInfos: { title },
    attributeValues: { sale, price, units_product },
  } = product;
  const units = (units_product?.value as number) ?? 0;
  const category = product.attributeValues.category?.value as
    | { value?: string; title?: string }
    | undefined;

  return (
    <>
      <h1 className="font-bold text-[20px] tracking-[0.02em] text-white">
        {title}
      </h1>

      <p className="mt-3 font-normal text-[16px] text-[#969696]">
        <Link prefetch={true} href={'/shop/category/' + category?.value}>
          {category?.title}
        </Link>
      </p>

      <div className="mb-5 mt-4 text-left text-xl font-bold leading-8 text-white">
        <PriceDisplay
          currentPrice={(sale?.value as number) ?? 0}
          originalPrice={(price?.value as number) ?? 0}
        />
      </div>

      <ProductUnits units={units} />

      <AddToCartButton
        id={id}
        units={units}
        statusIdentifier={statusIdentifier || ''}
        productTitle={title || ''}
        dict={dict}
        height={50}
        className="rounded-[10px] bg-custom-gradient font-bold uppercase text-white hover:bg-gradient-to-r-hover py-3 px-6"
      />
    </>
  );
};

export default ProductDetails;
