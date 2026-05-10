import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

/**
 * PriceDisplay — product price with/without discount for the grid card.
 *
 * @param   {object}      props            - Component props.
 * @param   {object}      props.attributes - Product attribute values (`sale`, `price`).
 * @returns JSX of the price (brand new price + strikethrough old price), or empty when no price set.
 */
const PriceDisplay = ({
  attributes: { sale, price },
}: {
  attributes: {
    sale?: { value: number };
    price?: { value: number };
  };
}): JSX.Element => {
  const currentPrice = sale?.value || 0;
  const originalPrice = price?.value || 0;
  if (!currentPrice && !originalPrice) {
    return <></>;
  }

  const newPrice = UsePrice({ amount: currentPrice });
  const oldPrice = UsePrice({
    amount: originalPrice,
  });

  return (
    <div className="flex gap-2.5 self-center font-bold">
      {currentPrice > 0 && (
        <div className="text-lg leading-6 text-brand" aria-label={`New price: ${newPrice}`}>
          {newPrice}
        </div>
      )}
      {originalPrice > 0 && (
        <div
          className={
            'leading-6 ' + (currentPrice ? 'text-paper text-sm line-through' : 'text-brand text-lg')
          }
          aria-label={`Original price: ${oldPrice}`}
        >
          {oldPrice}
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;
