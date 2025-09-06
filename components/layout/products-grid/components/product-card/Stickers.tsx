import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { FC, Key } from 'react';

import Sticker from './Sticker';

interface StickersProps {
  product: IProductsEntity;
}

/**
 * Stickers
 *
 * @param product product entity object.
 *
 * @returns Stickers array
 */
const Stickers: FC<StickersProps> = ({ product: { attributeValues } }) => {
  // extract attributes from attributeValues field of product
  const attributes = attributeValues['en_US'] || attributeValues;

  return [attributes?.stickers || []].map(
    (
      sticker: {
        value: {
          value: string;
          title: string;
          extended: {
            value: {
              downloadLink: string;
            };
          };
        };
      },
      i: Key,
    ) => {
      return <Sticker key={i} sticker={sticker} />;
    },
  );
};

export default Stickers;
