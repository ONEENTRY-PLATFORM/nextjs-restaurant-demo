'use client';

import type { JSX } from 'react';
import { useContext, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents } from '@/app/api/hooks/useEvents';
import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import CartAddIcon from '@/components/icons/cart-add';

import QuantitySelector from './QuantitySelector';

/** AddToCartButton — кнопка ADD TO CART, переключается в QuantitySelector после добавления. */
const AddToCartButton = ({
  id,
  units,
  productTitle,
  statusIdentifier,
  className,
  height,
}: {
  id: number;
  units: number;
  productTitle: string;
  statusIdentifier: string;
  className: string;
  height: number;
}): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  // useSyncExternalStore (не useEffect+setState) — чтобы избежать cascading-render warning
  // при гидрации persisted-корзины: SSR видит «add», клиент после маунта переключается.
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const inCartRaw = useAppSelector(state => selectIsInCart(state, id));
  const inCart = mounted && inCartRaw;
  const items = useAppSelector(state => state.cartReducer.productsData);
  const favoritesIds: number[] = useAppSelector(
    (state: { favoritesReducer: { products: number[] } }) => selectFavoritesItems(state)
  );
  const { user } = useContext(AuthContext);
  // `null` = «статус не назначен» = доступен; блокируем только при явном out_of_stock.
  const notInStock = useMemo(() => statusIdentifier === 'out_of_stock', [statusIdentifier]);

  if (notInStock) {
    return (
      <div className={'rounded-[5px] border border-muted text-muted px-4 py-2 ' + className}>
        {t('out_of_stock_button', 'Out of stock')}
      </div>
    );
  }

  const updateUserCartState = async () => {
    const updatedItems = items.some(product => product.id === id)
      ? items.map(product => ({
          id: product.id,
          quantity: product.id === id ? product.quantity + 1 : product.quantity,
          selected: true,
        }))
      : [...items, { id, quantity: 1, selected: true }];
    await updateUserState({
      favorites: favoritesIds,
      cart: updatedItems,
      user: user,
    });
    await onSubscribeEvents(id);
  };

  const addToCartHandle = async (): Promise<void> => {
    dispatch(addProductToCart({ id: id, selected: true, quantity: 1 }));
    toast('Product ' + productTitle + ' added to cart!');

    if (user) {
      updateUserCartState();
    }
  };

  const addToCartLabel = t('add_to_cart', 'ADD TO CART');

  return !inCart ? (
    <button
      onClick={() => addToCartHandle()}
      type="button"
      className={className}
      aria-label={`Add ${productTitle} to cart`}
    >
      {addToCartLabel}
      <CartAddIcon className="w-5 h-4.5" />
    </button>
  ) : (
    <QuantitySelector height={height} id={id} units={units} title={productTitle} />
  );
};

export default AddToCartButton;
