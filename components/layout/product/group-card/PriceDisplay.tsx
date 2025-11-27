import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * Price display component
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
      {currentPrice && (
        <div className="grow text-lg font-bold leading-4 text-orange-500">
          {price}
        </div>
      )}
      <div
        className={
          'leading-4 ' +
          (currentPrice ? 'text-gray-400 text-sm' : 'text-orange-500 text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
