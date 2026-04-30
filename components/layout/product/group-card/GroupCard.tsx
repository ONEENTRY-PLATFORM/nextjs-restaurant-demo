import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

import ApplyButton from './ApplyButton';
import PriceDisplay from './PriceDisplay';
import ProductImage from './ProductImage';

/**
 * Компонент карточки группы продуктов
 */
const GroupCard = ({
  product,
  dict,
}: {
  product: IProductsEntity;
  dict: IAttributeValues;
}): JSX.Element => {
  const attributeValues = product.attributeValues;
  const title = product.localizeInfos?.title;
  const images = attributeValues.more_pic?.value as
    | Array<{ downloadLink?: string }>
    | undefined;
  const pic1 = images?.[0]?.downloadLink;
  const pic2 = images?.[1]?.downloadLink;

  return (
    <div className="flex min-h-42.5 flex-row justify-between rounded-[5px] bg-[rgba(76,77,86,0.8)] p-4 transition-shadow hover:shadow-lg max-md:flex-col">
      <div className="flex min-w-full gap-2.5">
        <div className="flex w-[37%] flex-col">
          <h3 className="mb-5 text-sm leading-4 text-white/90">{title}</h3>
          <PriceDisplay
            currentPrice={(attributeValues?.sale?.value as number) ?? 0}
            originalPrice={product.price as number}
          />
          <ApplyButton product={product} dict={dict} />
        </div>

        <div className="flex w-[63%] flex-row justify-between">
          {pic1 ? (
            <ProductImage imageSrc={pic1} />
          ) : (
            <Placeholder className="min-h-27.5" />
          )}
          <div className="my-auto aspect-square w-4 shrink-0 text-white/90 text-center">
            +
          </div>
          {pic2 ? (
            <ProductImage imageSrc={pic2} />
          ) : (
            <Placeholder className="min-h-27.5" />
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
