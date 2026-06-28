import type { JSX } from 'react';

import { UsePrice } from '@/components/utils';

/**
 * PriceDisplay — cart-row price (brand current price with strikethrough old price, or just the old price).
 *
 * @param   {object}      props               - Component props.
 * @param   {number}      props.currentPrice  - Current (sale) price.
 * @param   {number}      props.originalPrice - Original (pre-sale) price.
 * @param   {string}      [props.currency]    - ISO-4217 currency code from the product `currency` attribute.
 * @returns JSX of the price block (or empty when both are zero/missing).
 */
const PriceDisplay = ({
  currentPrice,
  originalPrice,
  currency,
}: {
  currentPrice: number;
  originalPrice: number;
  currency?: string;
}): JSX.Element => {
  if (!currentPrice && !originalPrice) {
    return <></>;
  }
  const price = UsePrice({ amount: currentPrice, currency });
  const oldPrice = UsePrice({
    amount: originalPrice,
    currency,
  });

  return (
    <div className="flex gap-2.5 font-bold">
      {currentPrice > 0 && <div className="text-lg leading-8 text-brand">{price}</div>}
      <div
        className={
          'leading-8 ' + (currentPrice ? 'text-paper text-sm line-through' : 'text-brand text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
