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

/** Debounce window for coalescing rapid cart/favorites edits into a single server write. */
const SYNC_DEBOUNCE_MS = 800;

/**
 * useServerCartSync — keeps the OneEntry server cart/wishlist in sync with the optimistic Redux store.
 *
 * The Redux store is the UI source of truth (instant, optimistic). For authenticated users this hook
 * (a) merges the server cart/wishlist with the local one once on login and (b) mirrors every later
 * cart/favorites change to the dedicated `Users.setCart` / `Users.setWishlist` endpoints. Guests are
 * never mirrored to the server — their cart/favorites live purely in localStorage via redux-persist.
 *
 * On a guest→user login the merge reads `Users.getCart` / `getWishlist`, unions the server-only items
 * into Redux (server-only added with the server quantity, shared items bumped to the larger quantity)
 * after clearing the guest id, then opens a per-store gate so the mirror pushes the merged union back
 * to the server. The gate is per store and opens only after that store's read succeeds: if a read
 * fails, local data is never lost and the server is never overwritten blind (the mirror stays closed
 * for that store). The gates reset on logout so the next login merges again.
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

  // Per-store gates: a mirror may push only AFTER that store has merged local↔server on login.
  // Until then a push would clobber the server's cross-device data. Guests never flip these.
  const [cartSynced, setCartSynced] = useState(false);
  const [favSynced, setFavSynced] = useState(false);
  const mergeStartedRef = useRef(false);

  // Content keys — the mirror fires only when the cart / favorites actually change.
  const cartKey = useMemo(() => cartContentKey(productsData), [productsData]);
  const favKey = useMemo(() => favoritesKey(favorites), [favorites]);

  // Merge-on-login: read the server cart/wishlist, union the server items into Redux, then open the
  // per-store gates so the mirror pushes the merged union back. Runs once per login (guarded by the
  // ref); resets on logout. The cleanup latch (`cancelled`) drops a login merge whose user logged out
  // mid-read so we never write stale state.
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
      // Target the user (not the guest) for the merged reads/writes.
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

  // Mirror the Redux cart → server cart (authenticated users only, once the login merge opened the
  // gate). The merged union lands here via the `cartSynced`/`cartKey` dependencies.
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
