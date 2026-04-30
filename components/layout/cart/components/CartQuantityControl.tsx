'use client';

import type { JSX } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  decreaseProductQty,
  increaseProductQty,
  selectCartItemWithIdLength,
} from '@/app/store/reducers/CartSlice';

type CartQuantityControlProps = {
  id: number;
  units: number;
  title: string;
};

/**
 * Компактный контрол количества только для корзины — вертикальный стек
 * `+ / qty / -` в тонком бордерном боксе, по `cart_cart.html`. Всегда рендерится
 * для позиций, присутствующих в `productsData` (по умолчанию qty = 1, если
 * выше его забыли проставить).
 *
 * `-` декрементит, но НЕ удаляет строку — clamp до 1 в редьюсере. Удаление
 * продукта — отдельный action, доступный через иконку корзины (`DeleteButton`)
 * рядом с контролом.
 */
const CartQuantityControl = ({
  id,
  units,
}: CartQuantityControlProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => selectCartItemWithIdLength(state, id));
  const qty = (data?.quantity as number | undefined) ?? 1;

  const onIncrease = () => {
    dispatch(increaseProductQty({ id, quantity: 1, units }));
  };

  const onDecrease = () => {
    dispatch(decreaseProductQty({ id, quantity: 1 }));
  };

  return (
    <div className="flex h-17.5 w-8.75 flex-col items-center justify-between rounded-[5px] border border-white p-2.5 font-normal text-[20px] text-paper opacity-90">
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-3.75 cursor-pointer items-center justify-center -mt-0.5 hover:text-brand"
      >
        +
      </button>
      <div>{qty}</div>
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex h-2.5 cursor-pointer items-end justify-center mt-1.75 hover:text-brand"
      >
        -
      </button>
    </div>
  );
};

export default CartQuantityControl;
