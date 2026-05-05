import { type JSX, useContext } from 'react';
import { toast } from 'react-toastify';

import { onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { decreaseProductQty, removeProduct } from '@/app/store/reducers/CartSlice';

/**
 * Кнопка уменьшения количества
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
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  if (qty < 1) {
    return <></>;
  }

  /**
   * Удалить продукт из корзины и отписаться от событий
   */
  const onRemoveFromCart = async () => {
    dispatch(removeProduct(id));
    toast('Product ' + title + ' removed from cart!');

    if (user) {
      await onUnsubscribeEvents(id);
    }
  };

  /**
   * Уменьшить количество продукта
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
      className="relative m-1 box-border size-8 rounded-full text-center text-white/90 transition-all duration-500 hover:bg-white/10 hover:text-brand"
      aria-label="Decrease quantity"
    >
      –
    </button>
  );
};

export default DecreaseButton;
