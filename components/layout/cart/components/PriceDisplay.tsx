import React from 'react';

import { UsePrice } from '@/components/utils';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}

/**
 * Description
 * @param param0 param0
 *
 * @returns
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  currentPrice,
  originalPrice,
  dict,
}) => {
  if (!currentPrice && !originalPrice) {
    return;
  }
  const price = UsePrice({ amount: currentPrice });
  const oldPrice = UsePrice({
    amount: originalPrice,
  });

  return (
    <div className="flex gap-2.5 font-bold">
      {currentPrice > 0 && (
        <div className="text-lg leading-8 text-orange-500">{price}</div>
      )}
      <div
        className={
          'leading-8 ' +
          (currentPrice ? 'text-slate-300 text-sm' : 'text-orange-500 text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
