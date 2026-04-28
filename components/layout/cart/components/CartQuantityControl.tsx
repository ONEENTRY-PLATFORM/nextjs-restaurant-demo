'use client';

import { type JSX, useContext } from 'react';
import { toast } from 'react-toastify';

import { onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  decreaseProductQty,
  increaseProductQty,
  removeProduct,
  selectCartItemWithIdLength,
} from '@/app/store/reducers/CartSlice';

type CartQuantityControlProps = {
  id: number;
  units: number;
  title: string;
};

/**
 * Cart-only compact quantity control — vertical `+ / qty / -` stack inside a
 * thin bordered box, per `cart_cart.html`. Always renders for items present
 * in `productsData` (defaults qty to 1 if upstream forgot to set it).
 */
const CartQuantityControl = ({
  id,
  units,
  title,
}: CartQuantityControlProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const data = useAppSelector((state) => selectCartItemWithIdLength(state, id));
  const qty = (data?.quantity as number | undefined) ?? 1;

  const onIncrease = () => {
    dispatch(increaseProductQty({ id, quantity: 1, units }));
  };

  const onDecrease = async () => {
    if (qty <= 1) {
      dispatch(removeProduct(id));
      toast('Product ' + title + ' removed from cart!');
      if (user) {
        await onUnsubscribeEvents(id);
      }
      return;
    }
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
