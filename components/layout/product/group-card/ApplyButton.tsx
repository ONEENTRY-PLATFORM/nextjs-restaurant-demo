'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { useHydrated } from '@/app/hooks/useHydrated';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { addProductToCart, removeProduct, selectIsInCart } from '@/app/store/reducers/CartSlice';

/**
 * ApplyButton — Apply/Cancel toggle for adding a "buy together" group product to the cart.
 *
 * @param   {object}            props         - Component props.
 * @param   {IProductsEntity}   props.product - Product entity rendered in the group card.
 * @returns JSX of the Apply/Cancel button.
 */
const ApplyButton = ({ product }: { product: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(state => selectIsInCart(state, product.id));
  /**
   * Hydration gate: the persisted cart is unknown during SSR, so the button
   * renders its "Apply" state until hydration and only then reflects the real
   * cart — derived instead of mirrored into state from an effect.
   */
  const productInCart = useHydrated() && inCart;

  const addToCartHandle = () => {
    dispatch(addProductToCart({ id: product.id, selected: true, quantity: 1 }));
  };

  const removeFromCartHandle = () => {
    dispatch(removeProduct(product.id));
  };

  return !productInCart || !inCart ? (
    <button
      onClick={() => addToCartHandle()}
      className="mt-auto rounded-card border border-brand px-4 py-1.5 text-sm font-bold text-brand transition-colors duration-200 hover:text-paper active:bg-brand-soft-active active:text-white disabled:border-ink disabled:text-ink"
    >
      {t('apply_text', 'Apply')}
    </button>
  ) : (
    <button
      onClick={() => removeFromCartHandle()}
      className="mt-auto rounded-card border border-brand px-4 py-1.5 text-sm font-bold text-brand transition-colors duration-200 hover:text-paper active:bg-brand-soft-active active:text-white disabled:border-ink disabled:text-ink"
    >
      {t('cancel_text', '')}
    </button>
  );
};

export default ApplyButton;
