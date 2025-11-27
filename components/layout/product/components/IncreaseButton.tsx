import type { JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { increaseProductQty } from '@/app/store/reducers/CartSlice';

/**
 * Increase button component
 */
const IncreaseButton = ({ id, qty, units }: {
  id: number;
  qty: number;
  units: number;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  if (qty < 1) {
    return <></>;
  }

  // Increase product quantity
  const onIncreaseHandle = () => {
    dispatch(
      increaseProductQty({
        id: id,
        quantity: 1,
        units: units,
      }),
    );
  };

  return (
    <button
      onClick={() => onIncreaseHandle()}
      className="relative m-1 box-border size-8 rounded-full text-center text-slate-700 transition-all duration-500 hover:bg-slate-100 hover:text-orange-500 hover:shadow-inner"
      aria-label="Increase quantity"
    >
      +
    </button>
  );
};

export default IncreaseButton;
