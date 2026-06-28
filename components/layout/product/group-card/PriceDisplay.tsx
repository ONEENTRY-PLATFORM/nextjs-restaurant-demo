import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * PriceDisplay — product price inside the group card (brand current + strikethrough old).
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
