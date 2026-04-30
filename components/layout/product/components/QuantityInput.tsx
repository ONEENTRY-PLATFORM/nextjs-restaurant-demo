'use client';

import type { ChangeEvent, JSX } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { setProductQty } from '@/app/store/reducers/CartSlice';

/**
 * Инпут количества продукта
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

  // Устанавливаем ProductQty в cartSlice при изменении значения инпута
  const onChangeQtyHandle = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setProductQty({
        id: id,
        quantity: Number(e.target.value),
        units: units,
      }),
    );
  };

  return (
    <input
      className="relative box-border h-8 w-16 rounded-full bg-transparent text-center text-white/90 hover:bg-white/10 hover:text-brand"
      type="number"
      name={'qty_selector_' + id}
      id={'qty_selector_' + id}
      value={qty}
      onChange={(e) => onChangeQtyHandle(e)}
    />
  );
};

export default QuantityInput;
