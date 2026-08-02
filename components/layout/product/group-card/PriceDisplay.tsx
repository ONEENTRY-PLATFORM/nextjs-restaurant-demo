import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * PriceDisplay — product price inside the group card (brand current + strikethrough old).
 *
 * @param   {object}        props               - Component props.
 * @param   {number | null} props.currentPrice  - Current (sale) price; `null` when the `sale` attribute is unfilled.
 * @param   {number}        props.originalPrice - Original (pre-sale) price.
 * @param   {string}        [props.currency]    - ISO-4217 currency code from the product `currency` attribute.
 * @returns JSX of the price block (or empty when both are zero/missing).
 */
const PriceDisplay = ({
  currentPrice,
  originalPrice,
  currency,
}: {
  currentPrice: number | null;
  originalPrice: number;
  currency?: string;
}): JSX.Element => {
  if (!currentPrice && !originalPrice) {
    return <></>;
  }
  const hasSale = currentPrice != null && currentPrice > 0;
  const price = hasSale ? UsePrice({ amount: currentPrice, currency }) : '';
  const oldPrice = UsePrice({
    amount: originalPrice,
    currency,
  });

  return (
    <div className="mr-auto mb-5 flex gap-2 py-1">
      {hasSale && <div className="grow text-lg leading-4 font-bold text-brand">{price}</div>}
      <div
        className={
          'leading-4 ' + (hasSale ? 'text-paper text-sm line-through' : 'text-brand text-lg')
        }
      >
        {oldPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;
