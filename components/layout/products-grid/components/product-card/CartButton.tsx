'use client';

import type { JSX, MouseEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import {
  addProductToCart,
  decreaseProductQty,
  increaseProductQty,
  removeProduct,
  selectCartItemWithIdLength,
} from '@/app/store/reducers/CartSlice';

/**
 * stop — convenience helper that suppresses the wrapping `<Link>` navigation when a button inside the card is clicked.
 *
 * @param   {MouseEvent<HTMLButtonElement>} e - React mouse event from the button click.
 * @returns
 */
const stop = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * CartButton — grid-card cart toggle: switches between "add" and an inline +/qty/− control once the item is in the cart.
 *
 * @param   {object}      props          - Component props.
 * @param   {number}      props.id       - Cart product id.
 * @param   {string}      props.title    - Product title used in toast messages.
 * @param   {ReactNode}   props.children - Add-to-cart label content (rendered while the product is not yet in the cart).
 * @returns JSX of the cart toggle button or quantity control.
 */
const CartButton = ({
  id,
  title,
  children,
}: {
  id: number;
  title: string;
  children: ReactNode;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const item = useAppSelector(state => selectCartItemWithIdLength(state, id)) as
    { quantity?: number } | undefined;
  const qty = item?.quantity ?? 0;
  const titleSlot = (template: string) => template.replace('{title}', title);

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
          aria-label={t('decrease_quantity_label', 'Decrease quantity')}
          className="text-brand"
          onClick={e => {
            stop(e);
            if (qty <= 1) {
              dispatch(removeProduct(id));
              toast(
                titleSlot(t('product_removed_cart_toast', 'Product {title} removed from cart!'))
              );
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
          aria-label={t('increase_quantity_label', 'Increase quantity')}
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
        toast(titleSlot(t('product_added_cart_toast', 'Product {title} added to cart!')));
      }}
      aria-label={titleSlot(t('add_to_cart_aria_template', 'Add {title} to cart'))}
      className="menu_items_btn relative z-10"
    >
      {children}
    </button>
  );
};

export default CartButton;
