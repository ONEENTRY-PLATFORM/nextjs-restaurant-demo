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
  // Получаем массив stickers напрямую или используем пустой массив как fallback
  const stickers = attributeValues?.stickers || [];

  // Маппим stickers и рендерим компоненты Sticker
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
