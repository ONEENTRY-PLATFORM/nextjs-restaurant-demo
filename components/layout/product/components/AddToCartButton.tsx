'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents } from '@/app/api/hooks/useEvents';
import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addProductToCart,
  selectIsInCart,
} from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import CartAddIcon from '@/components/icons/cart-add';

import QuantitySelector from './QuantitySelector';

/**
 * AddToCart button with quantity selector component.
 */
const AddToCartButton = ({
  id,
  units,
  productTitle,
  statusIdentifier,
  className,
  height,
  dict,
}: {
  id: number;
  units: number;
  productTitle: string;
  statusIdentifier: string;
  className: string;
  height: number;
  dict: IAttributeValues;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  // Cart state hydrates from localStorage on the client → render the server-
  // safe variant (Add-to-cart button) до гидрации, иначе hydration mismatch
  // когда товар уже в корзине из persisted storage. useSyncExternalStore
  // вместо useEffect+setState — чтобы не было cascading-render warning.
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const inCartRaw = useAppSelector((state) => selectIsInCart(state, id));
  const inCart = mounted && inCartRaw;
  const items = useAppSelector((state) => state.cartReducer.productsData);
  const favoritesIds: number[] = useAppSelector(
    (state: { favoritesReducer: { products: number[] } }) =>
      selectFavoritesItems(state),
  );
  const { user } = useContext(AuthContext);
  const { out_of_stock_button, add_to_cart_button } = dict;
  const notInStock = useMemo(
    () => statusIdentifier !== 'in_stock',
    [statusIdentifier],
  );

  // If not InStock show out_of_stock button
  if (notInStock && out_of_stock_button) {
    return (
      <div
        className={
          'rounded-[5px] border border-muted text-muted px-4 py-2 ' + className
        }
      >
        {out_of_stock_button?.value as string | undefined}
      </div>
    );
  }

  // Update user state and subscribe to events
  const updateUserCartState = async () => {
    const updatedItems = items.some((product) => product.id === id)
      ? items.map((product) => ({
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

  // Add to cart
  const addToCartHandle = async (): Promise<void> => {
    dispatch(addProductToCart({ id: id, selected: true, quantity: 1 }));
    toast('Product ' + productTitle + ' added to cart!');

    // Update user state and subscribe to events
    if (user) {
      updateUserCartState();
    }
  };

  const addToCartLabel =
    (add_to_cart_button?.value as string | undefined) || 'ADD TO CART';

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
    <QuantitySelector
      height={height}
      id={id}
      units={units}
      title={productTitle}
    />
  );
};

export default AddToCartButton;
