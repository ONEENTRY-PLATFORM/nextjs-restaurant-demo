'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { setGuestId } from '@/app/api';
import { useServerCart, useServerWishlist } from '@/app/api/hooks/useServerCart';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { addProductToCart, selectCartData, setProductQty } from '@/app/store/reducers/CartSlice';
import { addFavorites, selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';

import {
  cartContentKey,
  cartToServerCartItems,
  favoritesKey,
  favoritesToWishlistItems,
  planCartMerge,
  planWishlistMerge,
} from './serverCartSync.utils';

const SYNC_DEBOUNCE_MS = 800;

/**
 * useServerCartSync — keeps the OneEntry server cart/wishlist in sync with the optimistic Redux store.
 *
 * @returns Nothing — mount once near the auth provider.
 */
export const useServerCartSync = (): void => {
  const { isAuth, isLoading } = useContext(AuthContext);
  const dispatch = useAppDispatch();
  const cart = useServerCart();
  const wishlist = useServerWishlist();
  const productsData = useAppSelector(selectCartData);
  const favorites = useAppSelector(selectFavoritesItems);

  const [cartSynced, setCartSynced] = useState(false);
  const [favSynced, setFavSynced] = useState(false);
  const mergeStartedRef = useRef(false);

  const cartKey = useMemo(() => cartContentKey(productsData), [productsData]);
  const favKey = useMemo(() => favoritesKey(favorites), [favorites]);

  // Merge-on-login.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuth) {
      mergeStartedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartSynced(false);
      setFavSynced(false);
      return;
    }
    if (mergeStartedRef.current) return;
    mergeStartedRef.current = true;

    let cancelled = false;
    void (async () => {
      setGuestId('');
      const [serverCart, serverWishlist] = await Promise.all([cart.get(), wishlist.get()]);
      if (cancelled) return;

      if (serverCart) {
        const { toAdd, toBump } = planCartMerge(productsData, serverCart.items ?? []);
        toAdd.forEach(p =>
          dispatch(addProductToCart({ id: p.id, selected: true, quantity: p.quantity }))
        );
        toBump.forEach(p => dispatch(setProductQty({ id: p.id, quantity: p.quantity, units: 0 })));
        setCartSynced(true);
      }
      if (serverWishlist) {
        planWishlistMerge(favorites, serverWishlist.items ?? []).forEach(id =>
          dispatch(addFavorites(id))
        );
        setFavSynced(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, isLoading]);

  // Mirror the Redux cart → server cart
  useEffect(() => {
    if (!isAuth || !cartSynced) return;
    const items = cartToServerCartItems(productsData);
    const handle = setTimeout(() => {
      void cart.set(items);
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, cartSynced, cartKey]);

  // Mirror favorites → server wishlist (same gating as the cart).
  useEffect(() => {
    if (!isAuth || !favSynced) return;
    const items = favoritesToWishlistItems(favorites);
    const handle = setTimeout(() => {
      void wishlist.set(items);
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, favSynced, favKey]);
};
