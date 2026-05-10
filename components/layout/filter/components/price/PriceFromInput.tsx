import type { Dispatch, JSX, SetStateAction } from 'react';
import { memo } from 'react';

/**
 * PriceFromInput — numeric input for the lower price bound; mirrors local state into `setPrice`.
 *
 * @param   {object}                              props          - Component props.
 * @param   {number}                              props.price    - Current value of the lower bound.
 * @param   {Dispatch<SetStateAction<number>>}    props.setPrice - State setter that owns the lower bound.
 * @returns JSX of the price-from input.
 */
const PriceFromInput = ({
  price,
  setPrice,
}: {
  price: number;
  setPrice: Dispatch<SetStateAction<number>>;
}): JSX.Element => {
  return (
    <input
      type="number"
      value={price}
      onChange={e => setPrice(Number(e.target.value))}
      className="w-5/6 bg-transparent"
    />
  );
};

export default memo(PriceFromInput);
