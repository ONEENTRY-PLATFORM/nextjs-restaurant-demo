import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getProductCurrency } from '@/app/api/hooks/useAttributesData';
import { UsePrice } from '@/components/utils';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * DeliveryRow — table row showing the delivery service product (image + title + price).
 *
 * @param   {object}            props          - Component props.
 * @param   {IProductsEntity}   props.delivery - OneEntry product representing the delivery service line item.
 * @returns JSX of the delivery table row.
 */
const DeliveryRow = ({ delivery }: { delivery: IProductsEntity }): JSX.Element => {
  return (
    <TableRowAnimations
      className="tr h-25 border-b border-solid border-muted max-md:max-w-full max-md:flex-wrap"
      index={10}
    >
      <div className="td w-3/12 align-middle">
        <Image
          loading="lazy"
          src="/images/icons/delivery.svg"
          alt="delivery"
          width={125}
          height={107}
          className="aspect-[1.16] w-31.25 max-w-full shrink-0 p-4 max-sm:p-2"
        />
      </div>
      <div className="td w-8/12 px-5 align-middle">
        <div className="mt-2 flex flex-col self-start">
          <div className="mb-4 text-base max-sm:mb-2">{delivery?.localizeInfos?.title}</div>
          <div className="mb-2 text-xl leading-8 font-bold">
            {UsePrice({
              amount: delivery?.price || 0,
              currency: getProductCurrency(delivery?.attributeValues),
            })}
          </div>
        </div>
      </div>
      <div className="td w-1/12 pl-5 align-middle" />
    </TableRowAnimations>
  );
};

export default DeliveryRow;
