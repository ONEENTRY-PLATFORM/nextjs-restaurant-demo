import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX, Key } from 'react';

import Sticker from './Sticker';

/** Stickers — список иконок-стикеров продукта. */
const Stickers = ({ product: { attributeValues } }: { product: IProductsEntity }): JSX.Element => {
  const stickers = attributeValues?.stickers || [];

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
              i: Key
            ) => {
              return <Sticker key={i} sticker={sticker} />;
            }
          )
        : null}
    </>
  );
};

export default Stickers;
