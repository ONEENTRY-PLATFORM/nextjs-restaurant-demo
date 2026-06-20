'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { setGuestId } from '@/app/api';
import { useServerCart, useServerWishlist } from '@/app/api/hooks/useServerCart';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';

/** Debounce window for coalescing rapid cart/favorites edits into a single server write. */
const SYNC_DEBOUNCE_MS = 800;

/**
 * useServerCartSync — mirrors the (optimistic) Redux cart + favorites to the OneEntry server cart/wishlist.
 *
 * The Redux store stays the UI source of truth (instant, optimistic), and this hook reflects every
 * cart/favorites change to the dedicated server `Users.setCart` / `Users.setWishlist` endpoints —
 * covering add, quantity, and remove uniformly without wiring each button. It runs for guests (via the
 * SDK `x-guest-id` header) and for authenticated users. On a guest→user login it re-pushes the merged
 * Redux cart (guest items already present, plus the restored user cart) to the user's server cart, then
 * clears the guest id so subsequent requests don't reuse it — the merge-on-login step. All writes are
 * best-effort: the underlying hooks resolve to `null` on SDK error and never throw.
 *
 * @returns Nothing — mount once near the auth provider.
 */
export const useServerCartSync = (): void => {
  const { isAuth, isLoading } = useContext(AuthContext);
  const cart = useServerCart();
  const wishlist = useServerWishlist();
  const productsData = useAppSelector(selectCartData);
  const favorites = useAppSelector(selectFavoritesItems);

  // Hold the first push until auth state settles, so a login can merge before we overwrite the cart.
  const [ready, setReady] = useState(false);
  const guestClearedRef = useRef(false);

  // Content keys — the mirror fires only when the cart / favorites actually change.
  const cartKey = useMemo(
    () =>
      productsData
        .filter(p => p.quantity > 0)
        .map(p => `${p.id}:${p.quantity}`)
        .sort()
        .join(','),
    [productsData]
  );
  const favKey = useMemo(() => [...favorites].sort((a, b) => a - b).join(','), [favorites]);

  useEffect(() => {
    if (isLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    // Clear the guest id exactly once after a login; reset the latch on logout for the next session.
    if (isAuth && !guestClearedRef.current) {
      guestClearedRef.current = true;
      setGuestId('');
    } else if (!isAuth) {
      guestClearedRef.current = false;
    }
  }, [isAuth, isLoading]);

  // Mirror the Redux cart → server cart. Depends on `isAuth` too, so a login re-pushes the merged
  // cart to the user's server cart (not the guest's).
  useEffect(() => {
    if (!ready) return;
    const items = productsData
      .filter(p => p.quantity > 0)
      .map(p => ({ productId: p.id, qty: p.quantity }));
    const handle = setTimeout(() => {
      void cart.set(items);
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isAuth, cartKey]);

  // Mirror favorites → server wishlist (same merge-on-login semantics via the `isAuth` dependency).
  useEffect(() => {
    if (!ready) return;
    const items = favorites.map(productId => ({ productId }));
    const handle = setTimeout(() => {
      void wishlist.set(items);
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isAuth, favKey]);
};
