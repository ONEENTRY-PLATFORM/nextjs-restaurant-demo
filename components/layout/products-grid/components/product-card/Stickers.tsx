import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';

import Sticker from './Sticker';

/**
 * Stickers
 */
const Stickers = ({
  product: { attributeValues },
}: {
  product: IProductsEntity;
}): JSX.Element => {
  // Get stickers array directly or use empty array as fallback
  const stickers = attributeValues?.stickers || [];

  // Map through stickers and render Sticker components
  return (
    <>
      {Array.isArray(stickers)
        ? stickers.map(
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
          )
        : null}
    </>
  );
};

export default Stickers;
