'use client';

import { useContext } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents, onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import {
  addProductToCart,
  selectCartItemWithIdLength,
  setCartTransition,
} from '@/app/store/reducers/CartSlice';

const UNDO_TIMEOUT_MS = 5000;

/**
 * useCartRemoveWithUndo — removes a cart item with an undo toast.
 *
 * @param   {number} productId - Cart product id to remove.
 * @param   {string} title     - Product title used in the toast message.
 * @returns Imperative remove function that displays the undo toast when invoked.
 */
export const useCartRemoveWithUndo = (productId: number, title: string): (() => void) => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const entry = useAppSelector(state => selectCartItemWithIdLength(state, productId)) as
    { id: number; quantity: number; selected: boolean } | undefined;

  return () => {
    const snapshot = entry
      ? {
          id: entry.id,
          quantity: entry.quantity ?? 1,
          selected: entry.selected ?? true,
        }
      : { id: productId, quantity: 1, selected: true };

    dispatch(setCartTransition({ productId }));
    if (user) {
      void onUnsubscribeEvents(productId);
    }

    const toastId = toast(
      ({ closeToast }) => (
        <div className="flex items-center gap-3">
          <span>
            {t('product_removed_cart_toast', 'Product {title} removed from cart!').replace(
              '{title}',
              title
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              dispatch(addProductToCart(snapshot));
              if (user) {
                void onSubscribeEvents(productId);
              }
              closeToast?.();
            }}
            className="min-w-10 font-bold text-brand hover:underline"
          >
            {t('undo_button', 'Undo')}
          </button>
        </div>
      ),
      { autoClose: UNDO_TIMEOUT_MS }
    );

    return toastId;
  };
};
