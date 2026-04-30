import type { JSX } from 'react';
import { useContext } from 'react';

import { onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  // removeProduct,
  setCartTransition,
} from '@/app/store/reducers/CartSlice';
import DeleteIcon from '@/components/icons/delete';

/**
 * Кнопка удаления продукта из корзины
 */
const DeleteButton = ({ productId }: { productId: number }): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);

  return (
    <button
      className="group relative box-border flex size-5 shrink-0 flex-col items-center justify-center"
      aria-label="Delete item"
      onClick={async () => {
        dispatch(setCartTransition({ productId: productId }));
        // dispatch(removeProduct(productId));
        if (user) {
          await onUnsubscribeEvents(productId);
        }
      }}
    >
      <DeleteIcon />
    </button>
  );
};

export default DeleteButton;
