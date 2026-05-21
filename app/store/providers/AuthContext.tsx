'use client';

import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

import { getLang, hasActiveSession, reDefine, useLazyGetMeQuery } from '@/app/api';
import type { IProducts } from '@/app/types/global';

import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addProductToCart,
  selectCartData,
  selectCartVersion,
  setCartVersion,
} from '../reducers/CartSlice';
import { selectFavoritesItems } from '../reducers/FavoritesSlice';

type AuthProviderProps = {
  children: ReactNode;
};

/** AuthContext — user authentication context. */
export const AuthContext = createContext<{
  isAuth: boolean;
  isLoading: boolean;
  userToken?: string;
  user?: IUserEntity;
  authenticate: () => void;
  refreshUser: () => void;
}>({
  isAuth: false,
  isLoading: false,
  authenticate: () => {},
  refreshUser: () => {},
});

/**
 * AuthProvider — authentication provider that hydrates the OneEntry session and exposes it via {@link AuthContext}.
 *
 * @param   {AuthProviderProps} props          - Component props.
 * @param   {ReactNode}         props.children - Subtree that consumes `AuthContext`.
 * @returns JSX provider wrapping children with the auth context value.
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<IUserEntity | undefined>();
  const [refetch, setRefetch] = useState<boolean>(false);
  const [refetchUser, setRefetchUser] = useState<boolean>(false);

  const cartVersion = useAppSelector(selectCartVersion) as number;
  const productsInCart = useAppSelector(selectCartData);
  const favoritesIds = useAppSelector((state: { favoritesReducer: { products: number[] } }) =>
    selectFavoritesItems(state)
  );

  // 60s instead of 3s: getMe is just a keepalive / cross-tab session probe; 3s
  // polling burned ~20 requests/min per logged-in tab for no UX benefit.
  const [trigger, { isError }] = useLazyGetMeQuery({
    pollingInterval: isAuth ? 60000 : 0,
  });

  const onInit = async () => {
    const refresh = localStorage.getItem('refresh-token');

    if (!refresh) {
      setIsAuth(false);
      return;
    }
    // hasActiveSession guards against re-mounts: every reDefine hits /refresh
    // and would otherwise burn the current token.
    if (!hasActiveSession()) {
      await reDefine(refresh, getLang());
    }
    await checkToken();
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- getLang is a stable module-level function
  const checkToken = useCallback(async () => {
    trigger(getLang())
      .then(async res => {
        if ((res.isError && !res.isLoading) || !res.data?.id) {
          localStorage.removeItem('refresh-token');
          setIsAuth(false);
        } else {
          setUser(res.data);
          setIsAuth(true);
        }
      })
      .catch(async () => {
        localStorage.removeItem('refresh-token');
        setIsAuth(false);
      });
  }, [trigger]);

  const updateUserData = async (): Promise<void> => {
    if (!user) {
      return;
    }
  };

  useEffect(() => {
    if (!isAuth || !user) {
      return;
    }
    updateUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, productsInCart, favoritesIds]);

  useEffect(() => {
    if (!user?.state.cart || cartVersion > 0) {
      return;
    }

    (user.state.cart as IProducts[] | undefined)?.forEach(product => {
      const productInCart = productsInCart?.find((p: { id: number }) => p.id === product.id);
      if (!productInCart) {
        // The reducer expects `{ id, selected, quantity }`; without quantity here
        // the QuantitySelector in the cart is hidden and totals stay at $0.
        dispatch(addProductToCart({ id: product.id, selected: true, quantity: 1 }));
      }
    });

    dispatch(setCartVersion(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, dispatch, productsInCart]);

  useEffect(() => {
    // Synchronous setState in the effect body — mark "loading" before the
    // asynchronous onInit starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    onInit().then(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  useEffect(() => {
    const refresh = localStorage.getItem('refresh-token');
    if (isError && refresh) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefetch(true);
      localStorage.removeItem('refresh-token');
      setIsAuth(false);
    }
  }, [isError]);

  useEffect(() => {
    if (isAuth) {
      checkToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, refetchUser, isAuth]);

  const value = {
    isAuth,
    isLoading,
    ...(user && { user }),
    authenticate: () => setRefetch(!refetch),
    refreshUser: () => setRefetchUser(!refetchUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
