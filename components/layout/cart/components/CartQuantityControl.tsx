'use client';

import type { ChangeEvent, JSX, KeyboardEvent } from 'react';
import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  decreaseProductQty,
  increaseProductQty,
  selectCartItemWithIdLength,
  setProductQty,
} from '@/app/store/reducers/CartSlice';

import { useCartRemoveWithUndo } from './useCartRemoveWithUndo';

type CartQuantityControlProps = {
  id: number;
  units: number;
  title: string;
};

/**
 * CartQuantityControl — compact +/qty/− control; the `−` step at `qty === 1` removes the item with an undo toast.
 *
 * @param   {CartQuantityControlProps} props       - Component props.
 * @param   {number}                   props.id    - Cart product id.
 * @param   {number}                   props.units - Maximum allowed units (cap forwarded to the increment handler).
 * @param   {string}                   props.title - Product title used in the removal toast text.
 * @returns JSX of the vertical +/qty/− control.
 */
const CartQuantityControl = ({ id, units, title }: CartQuantityControlProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => selectCartItemWithIdLength(state, id));
  const qty = (data?.quantity as number | undefined) ?? 1;
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? String(qty);
  const removeWithUndo = useCartRemoveWithUndo(id, title);

  const onIncrease = () => {
    dispatch(increaseProductQty({ id, quantity: 1, units }));
  };

  const onDecrease = () => {
    if (qty <= 1) {
      removeWithUndo();
      return;
    }
    dispatch(decreaseProductQty({ id, quantity: 1 }));
  };

  /**
   * commit — applies the entered quantity; invalid or zero removes the item with undo.
   *
   * @returns
   */
  const commit = () => {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraft(null);
      removeWithUndo();
      return;
    }
    dispatch(setProductQty({ id, quantity: parsed, units }));
    setDraft(null);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value.replace(/[^\d]/g, ''));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex h-17.5 w-8.75 flex-col items-stretch rounded-card border border-white font-normal text-xl text-paper opacity-90">
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex flex-1 cursor-pointer items-center justify-center leading-none hover:text-brand"
      >
        +
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={onChange}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onFocus={e => e.currentTarget.select()}
        aria-label="Quantity"
        className="w-full shrink-0 bg-transparent text-center leading-none outline-none focus:text-brand"
      />
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex flex-1 cursor-pointer items-center justify-center leading-none hover:text-brand"
      >
        -
      </button>
    </div>
  );
};

export default CartQuantityControl;
