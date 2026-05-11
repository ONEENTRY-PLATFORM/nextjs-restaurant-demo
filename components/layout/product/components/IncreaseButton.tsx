'use client';

import type { JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { increaseProductQty } from '@/app/store/reducers/CartSlice';

/**
 * IncreaseButton — "+" button for `QuantitySelector` capped at `units`.
 *
 * @param   {object}      props       - Component props.
 * @param   {number}      props.id    - Cart product id to increment.
 * @param   {number}      props.qty   - Current quantity (renders empty when below 1).
 * @param   {number}      props.units - Maximum allowed units (cap respected by the reducer).
 * @returns JSX of the round increment button.
 */
const IncreaseButton = ({
  id,
  qty,
  units,
}: {
  id: number;
  qty: number;
  units: number;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  if (qty < 1) {
    return <></>;
  }

  const onIncreaseHandle = () => {
    dispatch(
      increaseProductQty({
        id: id,
        quantity: 1,
        units: units,
      })
    );
  };

  return (
    <button
      onClick={() => onIncreaseHandle()}
      className="relative m-1 box-border size-8 rounded-full text-center text-white/90 transition-all duration-500 hover:bg-white/10 hover:text-brand"
      aria-label={t('increase_quantity_label', 'Increase quantity')}
    >
      +
    </button>
  );
};

export default IncreaseButton;
