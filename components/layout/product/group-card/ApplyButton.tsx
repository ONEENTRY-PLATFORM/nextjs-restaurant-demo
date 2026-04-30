'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  addProductToCart,
  removeProduct,
  selectIsInCart,
} from '@/app/store/reducers/CartSlice';

/**
 * Компонент кнопки Apply
 */
const ApplyButton = ({
  product,
  dict,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  dict: IAttributeValues;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const [productInCart, setInCart] = useState(false);
  const { apply_text, cancel_text } = dict;
  const inCart = useAppSelector((state) => selectIsInCart(state, product.id));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInCart(inCart);
  }, [inCart]);

  const addToCartHandle = () => {
    dispatch(addProductToCart({ id: product.id, selected: true, quantity: 1 }));
  };

  const removeFromCartHandle = () => {
    dispatch(removeProduct(product.id));
  };

  return !productInCart || !inCart ? (
    <button
      onClick={() => addToCartHandle()}
      className="rounded-[5px] border border-brand text-brand px-4 py-1.5 mt-auto text-sm font-bold hover_btn_white"
    >
      {(apply_text?.value as string | undefined) ?? 'Apply'}
    </button>
  ) : (
    <button
      onClick={() => removeFromCartHandle()}
      className="rounded-[5px] border border-brand text-brand px-4 py-1.5 mt-auto text-sm font-bold hover_btn_white"
    >
      {cancel_text?.value as string | undefined}
    </button>
  );
};

export default ApplyButton;
