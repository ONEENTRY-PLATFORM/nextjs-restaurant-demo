import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProductCurrency } from '@/app/api';
import Placeholder from '@/components/shared/Placeholder';

import ApplyButton from './ApplyButton';
import PriceDisplay from './PriceDisplay';
import ProductImage from './ProductImage';

/**
 * GroupCard — card for a pair of products from a "buy together" group.
 *
 * @param   {object}            props         - Component props.
 * @param   {IProductsEntity}   props.product - OneEntry product with `more_pic` (image array).
 * @returns JSX of the group card.
 */
const GroupCard = ({ product }: { product: IProductsEntity }): JSX.Element => {
  const attributeValues = product.attributeValues;
  const title = product.localizeInfos?.title;
  // Image attributes arrive as an object for a single file and as an array for many —
  // normalize both shapes into an array before indexing.
  const morePicRaw: unknown = attributeValues.more_pic?.value;
  const images = morePicRaw ? ([morePicRaw].flat() as Array<{ downloadLink?: string }>) : [];
  const pic1 = images[0]?.downloadLink;
  const pic2 = images[1]?.downloadLink;
  // Unfilled numeric `sale` is `null` — keep it distinct from a real 0 so PriceDisplay
  // can tell "no sale" apart from a zero price.
  const saleRaw: unknown = attributeValues?.sale?.value;
  const salePrice = typeof saleRaw === 'number' ? saleRaw : null;

  return (
    <div className="flex min-h-42.5 flex-row justify-between rounded-card bg-ink/80 p-4 transition-shadow hover:shadow-lg max-md:flex-col">
      <div className="flex min-w-full gap-2.5">
        <div className="flex w-[37%] flex-col">
          <h3 className="mb-5 text-sm leading-4 text-white/90">{title}</h3>
          <PriceDisplay
            currentPrice={salePrice}
            originalPrice={product.price as number}
            currency={getProductCurrency(attributeValues)}
          />
          <ApplyButton product={product} />
        </div>

        <div className="flex w-[63%] flex-row justify-between">
          {pic1 ? <ProductImage imageSrc={pic1} /> : <Placeholder className="min-h-27.5" />}
          <div className="my-auto aspect-square w-4 shrink-0 text-center text-white/90">+</div>
          {pic2 ? <ProductImage imageSrc={pic2} /> : <Placeholder className="min-h-27.5" />}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
