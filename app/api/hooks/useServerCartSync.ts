'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useServerCart, useServerWishlist } from '@/app/api/hooks/useServerCart';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addProductToCart,
  removeProduct,
  selectCartData,
  setProductQty,
} from '@/app/store/reducers/CartSlice';
import {
  addFavorites,
  removeFavorites,
  selectFavoritesItems,
} from '@/app/store/reducers/FavoritesSlice';

import { errorGuard } from './errorGuard';
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

  /**
   * Reset-on-logout, done by adjusting state during render (React's documented
   * alternative to a setState inside an effect body): signing out must clear
   * the sync flags so the next login re-runs the merge before mirroring
   * resumes. Doing it here means the flags are already false in the very
   * render that observes the logout, with no cascading re-render. The
   * `mergeStartedRef` latch is reset by the merge effect below — refs must not
   * be mutated during render.
   */
  const [prevAuth, setPrevAuth] = useState(isAuth);
  if (prevAuth !== isAuth) {
    setPrevAuth(isAuth);
    if (!isAuth) {
      setCartSynced(false);
      setFavSynced(false);
    }
  }

  // Merge-on-login.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuth) {
      mergeStartedRef.current = false;
      return;
    }
    if (mergeStartedRef.current) return;
    mergeStartedRef.current = true;

    let cancelled = false;
    void (async () => {
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
    // Merge runs once per login-state change — reacting to cart/favorites content would re-merge on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, isLoading]);

  // Mirror the Redux cart → server cart. errorGuard heals the "Some products do not exist"
  // rejection: stale ids (deleted in the CMS, still in redux-persist) are pruned from the cart
  // and the write is retried with the survivors.
  useEffect(() => {
    if (!isAuth || !cartSynced) return;
    const items = cartToServerCartItems(productsData);
    const handle = setTimeout(() => {
      void errorGuard(items, cart.set, phantomIds =>
        phantomIds.forEach(id => dispatch(removeProduct(id)))
      );
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // `cartKey` is the content signature — raw `productsData`/`dispatch` identities would re-schedule the debounce every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, cartSynced, cartKey]);

  // Mirror favorites → server wishlist (same gating and stale-id healing as the cart).
  useEffect(() => {
    if (!isAuth || !favSynced) return;
    const items = favoritesToWishlistItems(favorites);
    const handle = setTimeout(() => {
      void errorGuard(items, wishlist.set, phantomIds =>
        phantomIds.forEach(id => dispatch(removeFavorites(id)))
      );
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // `favKey` is the content signature — raw `favorites`/`dispatch` identities would re-schedule the debounce every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, favSynced, favKey]);
};
