import type { Dispatch, JSX, SetStateAction } from 'react';
import { memo } from 'react';

/**
 * PriceToInput — numeric input for the upper price bound; mirrors local state into `setPrice`.
 *
 * @param   {object}                              props          - Component props.
 * @param   {number}                              props.price    - Current value of the upper bound.
 * @param   {Dispatch<SetStateAction<number>>}    props.setPrice - State setter that owns the upper bound.
 * @returns {JSX.Element} JSX of the price-to input.
 */
const PriceToInput = ({
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

export default memo(PriceToInput);
