import type { JSX } from 'react';

import { UsePrice } from '../../../utils';

/**
 * PriceDisplay — цена продукта в карточке группы.
 * @param   {object} props               - Пропсы компонента.
 * @param   {number} props.currentPrice  - Текущая (sale) цена.
 * @param   {number} props.originalPrice - Оригинальная цена.
 * @returns {JSX.Element}                JSX блока цен.
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
