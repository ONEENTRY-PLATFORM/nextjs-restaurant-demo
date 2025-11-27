import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

/**
 * Price display
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

  // Format price with Intl.NumberFormat
  const newPrice = UsePrice({ amount: currentPrice });
  const oldPrice = UsePrice({
    amount: originalPrice,
  });

  return (
    <div className="flex gap-2.5 self-center font-bold">
      {currentPrice > 0 && (
        <div
          className="text-lg leading-6 text-orange-500"
          aria-label={`New price: ${newPrice}`}
        >
          {newPrice}
        </div>
      )}
      {originalPrice > 0 && (
        <div
          className={
            'leading-6 ' +
            (currentPrice
              ? 'text-slate-300 text-sm'
              : 'text-orange-500 text-lg')
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
