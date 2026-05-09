import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * PriceDisplay — product price inside the group card.
 * @param   {object} props               - Component props.
 * @param   {number} props.currentPrice  - Current (sale) price.
 * @param   {number} props.originalPrice - Original price.
 * @returns {JSX.Element}                Price block JSX.
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
    <div className="mb-5 mr-auto flex gap-2 py-1">
      {currentPrice && <div className="grow text-lg font-bold leading-4 text-brand">{price}</div>}
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
