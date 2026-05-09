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

/** AuthContext — контекст аутентификации пользователя. */
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
 * AuthProvider — провайдер аутентификации.
 *
 * @param   {AuthProviderProps} props          - Свойства.
 * @param   {ReactNode}         props.children - Дочерний ReactNode.
 * @returns {JSX.Element}                      JSX провайдер AuthContext.
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

  const [trigger, { isError }] = useLazyGetMeQuery({
    pollingInterval: isAuth ? 3000 : 0,
  });

  const onInit = async () => {
    const refresh = localStorage.getItem('refresh-token');

    if (!refresh) {
      setIsAuth(false);
      return;
    }
    // hasActiveSession защищает от ре-маунтов: каждый reDefine идёт на /refresh
    // и иначе сжигал бы текущий токен.
    if (!hasActiveSession()) {
      await reDefine(refresh, getLang());
    }
    await checkToken();
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- getLang — стабильная функция уровня модуля
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
        // Редьюсер ожидает `{ id, selected, quantity }`; без quantity здесь
        // QuantitySelector в корзине скрывается, а тоталы остаются $0.
        dispatch(addProductToCart({ id: product.id, selected: true, quantity: 1 }));
      }
    });

    dispatch(setCartVersion(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, dispatch, productsInCart]);

  useEffect(() => {
    // Синхронный setState в теле эффекта — помечаем «loading» до старта
    // асинхронного onInit.
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
