'use client';

import type { JSX } from 'react';
import { useContext, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents } from '@/app/api/hooks/useEvents';
import { trackActivity } from '@/app/api/hooks/useTrackActivity';
import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { useOutOfStockMarker } from '@/app/store/providers/ProductStatusContext';
import { addProductToCart, selectIsInCart } from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import CartAddIcon from '@/components/icons/cart-add';

import QuantitySelector from './QuantitySelector';

/**
 * AddToCartButton — "ADD TO CART" button that switches to `QuantitySelector` after adding.
 *
 * @param   {object}      props                  - Component props.
 * @param   {number}      props.id               - Product id to add.
 * @param   {number}      props.units            - Maximum allowed units (used by the quantity selector cap).
 * @param   {string}      props.productTitle     - Product title used in the toast text.
 * @param   {string}      props.statusIdentifier - Product status; `'out_of_stock'` renders the disabled visual.
 * @param   {string}      props.className        - Class merged onto the button.
 * @param   {number}      props.height           - Pixel height passed to the quantity selector.
 * @returns JSX of the add-to-cart button (active or disabled), or the quantity selector once in cart.
 */
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
  const outOfStockMarker = useOutOfStockMarker();
  const notInStock = useMemo(
    () => statusIdentifier === outOfStockMarker,
    [statusIdentifier, outOfStockMarker]
  );

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

  const titleSlot = (template: string) => template.replace('{title}', productTitle);

  const addToCartHandle = async (): Promise<void> => {
    dispatch(addProductToCart({ id: id, selected: true, quantity: 1 }));
    toast(titleSlot(t('product_added_cart_toast', 'Product {title} added to cart!')));
    trackActivity({ type: 'product_add_to_cart', productId: id });

    if (user) {
      updateUserCartState();
    }
  };

  const addToCartLabel = t('add_to_cart', 'ADD TO CART');
  const outOfStockLabel = t('out_of_stock_button', 'Out of stock');

  return inCart ? (
    <QuantitySelector height={height} id={id} units={units} title={productTitle} />
  ) : (
    <button
      onClick={notInStock ? undefined : () => addToCartHandle()}
      type="button"
      disabled={notInStock}
      className={
        notInStock
          ? `${className} cursor-not-allowed bg-disabled-bg bg-none backdrop-blur-card`
          : className
      }
      aria-label={
        notInStock
          ? titleSlot(t('out_of_stock_aria_template', '{title} is out of stock'))
          : titleSlot(t('add_to_cart_aria_template', 'Add {title} to cart'))
      }
    >
      {notInStock ? outOfStockLabel : addToCartLabel}
      {!notInStock && <CartAddIcon className="h-4.5 w-5" />}
    </button>
  );
};

export default AddToCartButton;
