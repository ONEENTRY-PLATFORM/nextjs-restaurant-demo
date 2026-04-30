import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

/**
 * Компонент отображения цены
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
    <div className="flex gap-2.5 font-bold">
      {currentPrice > 0 && (
        <div className="text-lg leading-8 text-brand">{price}</div>
      )}
      <div
        className={
          'leading-8 ' +
          (currentPrice
            ? 'text-paper text-sm line-through'
            : 'text-brand text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
