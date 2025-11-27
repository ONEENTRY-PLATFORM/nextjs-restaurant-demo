import { type JSX, useContext } from 'react';
import { toast } from 'react-toastify';

import { onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  decreaseProductQty,
  removeProduct,
} from '@/app/store/reducers/CartSlice';

/**
 * Decrease qty button
 */
const DecreaseButton = ({ id, qty, title }: {
  id: number;
  qty: number;
  title: string;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  if (qty < 1) {
    return <></>;
  }

  /**
   * Remove product from cart and unsubscribe from events
   */
  const onRemoveFromCart = async () => {
    dispatch(removeProduct(id));
    toast('Product ' + title + ' removed from cart!');

    if (user) {
      await onUnsubscribeEvents(id);
    }
  };

  /**
   * Decrease product quantity
   */
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
      className="relative m-1 box-border size-8 rounded-full text-center text-slate-700 transition-all duration-500 hover:bg-slate-100 hover:text-orange-500 hover:shadow-inner"
      aria-label="Decrease quantity"
    >
      –
    </button>
  );
};

export default DecreaseButton;
