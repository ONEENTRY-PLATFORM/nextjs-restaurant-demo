import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

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
    <div className="flex gap-2.5 self-center font-bold">
      {currentPrice > 0 && (
        <div className="text-lg leading-6 text-orange-500">{price}</div>
      )}
      <div
        className={
          'leading-6 ' +
          (currentPrice ? 'text-slate-300 text-sm' : 'text-orange-500 text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
