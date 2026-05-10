import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

/**
 * PriceDisplay — current/original product price (brand current with strikethrough old).
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
    <div className="flex gap-2.5 self-center font-bold">
      {currentPrice > 0 && <div className="text-lg leading-6 text-brand">{price}</div>}
      <div
        className={
          'leading-6 ' + (currentPrice ? 'text-paper text-sm line-through' : 'text-brand text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
