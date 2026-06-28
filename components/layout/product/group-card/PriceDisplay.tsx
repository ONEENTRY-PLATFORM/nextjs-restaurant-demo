import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * PriceDisplay — product price inside the group card (brand current + strikethrough old).
 *
 * @param   {object}      props               - Component props.
 * @param   {number}      props.currentPrice  - Current (sale) price.
 * @param   {number}      props.originalPrice - Original (pre-sale) price.
 * @returns JSX of the price block (or empty when both are zero/missing).
 */
const PriceDisplay = ({
  currentPrice,
  originalPrice,
}: {
  currentPrice: number;
  originalPrice: number;
}): JSX.Element => {
  if (!currentPrice && !originalPrice) {
    return <></>;
  }
  const price = UsePrice({ amount: currentPrice });
  const oldPrice = UsePrice({
    amount: originalPrice,
  });

  return (
    <div className="mr-auto mb-5 flex gap-2 py-1">
      {currentPrice && <div className="grow text-lg leading-4 font-bold text-brand">{price}</div>}
      <div
        className={
          'leading-4 ' + (currentPrice ? 'text-paper text-sm line-through' : 'text-brand text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
