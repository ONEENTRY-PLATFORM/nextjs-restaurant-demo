'use client';

import { useContext } from 'react';
import { toast } from 'react-toastify';

import {
  onSubscribeEvents,
  onUnsubscribeEvents,
} from '@/app/api/hooks/useEvents';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addProductToCart,
  selectCartItemWithIdLength,
  setCartTransition,
} from '@/app/store/reducers/CartSlice';

const UNDO_TIMEOUT_MS = 5000;

/**
 * Удаляет позицию из корзины с возможностью отмены: запускает анимацию ухода
 * через `setCartTransition` (фактический `removeProduct` дёргается в
 * `ProductAnimations` после fade-out), а пользователю показывает toast с
 * прогресс-таймером и кнопкой Undo. По нажатию Undo восстанавливает запись
 * (id/quantity/selected) через `addProductToCart` и переподписывает события.
 */
export const useCartRemoveWithUndo = (
  productId: number,
  title: string,
): (() => void) => {
  const dispatch = useAppDispatch();
  const { user } = useContext(AuthContext);
  const entry = useAppSelector((state) =>
    selectCartItemWithIdLength(state, productId),
  ) as { id: number; quantity: number; selected: boolean } | undefined;

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
          <span>Product {title} removed from cart</span>
          <button
            type="button"
            onClick={() => {
              dispatch(addProductToCart(snapshot));
              if (user) {
                void onSubscribeEvents(productId);
              }
              closeToast?.();
            }}
            className="font-bold text-brand hover:underline"
          >
            Undo
          </button>
        </div>
      ),
      { autoClose: UNDO_TIMEOUT_MS },
    );

    return toastId;
  };
};
