'use client';

import type { JSX, MouseEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addProductToCart,
  decreaseProductQty,
  increaseProductQty,
  removeProduct,
  selectCartItemWithIdLength,
} from '@/app/store/reducers/CartSlice';

const stop = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

const CartButton = ({
  id,
  title,
  children,
}: {
  id: number;
  title: string;
  children: ReactNode;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const item = useAppSelector(state => selectCartItemWithIdLength(state, id)) as
    | { quantity?: number }
    | undefined;
  const qty = item?.quantity ?? 0;

  // redux-persist регидратит корзину на клиенте — qty может отличаться от SSR (0).
  // На первом paint рендерим кнопку «add» (как на сервере), переключаемся после mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (hydrated && qty > 0) {
    return (
      <div
        className="menu_items_btn relative z-10"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          aria-label="Decrease quantity"
          className="text-brand"
          onClick={e => {
            stop(e);
            if (qty <= 1) {
              dispatch(removeProduct(id));
              toast('Product ' + title + ' removed from cart!');
            } else {
              dispatch(decreaseProductQty({ id, quantity: 1 }));
            }
          }}
        >
          −
        </button>
        <p className="counter">x{qty}</p>
        <button
          type="button"
          aria-label="Increase quantity"
          className="text-brand"
          onClick={e => {
            stop(e);
            dispatch(increaseProductQty({ id, quantity: 1, units: 99 }));
          }}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={e => {
        stop(e);
        dispatch(addProductToCart({ id, selected: true, quantity: 1 }));
        toast('Product ' + title + ' added to cart!');
      }}
      aria-label={`Add ${title} to cart`}
      className="menu_items_btn relative z-10"
    >
      {children}
    </button>
  );
};

export default CartButton;
