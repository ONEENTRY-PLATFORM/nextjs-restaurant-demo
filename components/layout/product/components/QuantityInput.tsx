'use client';

import type { ChangeEvent, JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { setProductQty } from '@/app/store/reducers/CartSlice';

/**
 * QuantityInput — numeric quantity input for `QuantitySelector`; mirrors changes into the cart slice.
 *
 * @param   {object}      props       - Component props.
 * @param   {number}      props.id    - Cart product id whose quantity is being edited.
 * @param   {number}      props.qty   - Current quantity value.
 * @param   {number}      props.units - Maximum allowed units (passed through for cap enforcement in the reducer).
 * @returns JSX of the round quantity input.
 */
const QuantityInput = ({
  id,
  qty,
  units,
}: {
  id: number;
  qty: number;
  units: number;
}): JSX.Element => {
  const dispatch = useAppDispatch();

  const onChangeQtyHandle = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setProductQty({
        id: id,
        quantity: Number(e.target.value),
        units: units,
      })
    );
  };

  return (
    <input
      className="relative box-border h-8 w-16 rounded-full bg-transparent text-center text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-brand"
      type="number"
      name={'qty_selector_' + id}
      id={'qty_selector_' + id}
      value={qty}
      onChange={e => onChangeQtyHandle(e)}
    />
  );
};

export default QuantityInput;
