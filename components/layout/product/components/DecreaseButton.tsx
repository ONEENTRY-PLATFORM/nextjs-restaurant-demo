'use client';

import { type JSX, useContext } from 'react';
import { toast } from 'react-toastify';

import { onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { decreaseProductQty, removeProduct } from '@/app/store/reducers/CartSlice';

/**
 * DecreaseButton — "−" button for `QuantitySelector`; removes the item when `qty<=1`.
 *
 * @param   {object}      props       - Component props.
 * @param   {number}      props.id    - Cart product id to decrement.
 * @param   {number}      props.qty   - Current quantity (renders empty when below 1).
 * @param   {string}      props.title - Product title used in the removal toast text.
 * @returns JSX of the round decrement button.
 */
const DecreaseButton = ({
  id,
  qty,
  title,
}: {
  id: number;
  qty: number;
  title: string;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  if (qty < 1) {
    return <></>;
  }

  const onRemoveFromCart = async () => {
    dispatch(removeProduct(id));
    toast(
      t('product_removed_cart_toast', 'Product {title} removed from cart!').replace(
        '{title}',
        title
      )
    );

    if (user) {
      await onUnsubscribeEvents(id);
    }
  };

  const onDecreaseHandle = () => {
    dispatch(decreaseProductQty({ id: id, quantity: 1 }));
  };

  return (
    <button
      onClick={async () => {
        if (qty <= 1) {
          onRemoveFromCart();
        } else {
          onDecreaseHandle();
        }
      }}
      className="relative m-1 box-border size-8 rounded-full text-center text-white/90 transition-all duration-500 hover:bg-white/10 hover:text-brand"
      aria-label={t('decrease_quantity_label', 'Decrease quantity')}
    >
      –
    </button>
  );
};

export default DecreaseButton;
