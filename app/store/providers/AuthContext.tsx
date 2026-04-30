'use client';

import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

import {
  getLang,
  hasActiveSession,
  reDefine,
  useLazyGetMeQuery,
} from '@/app/api';
import type { IProducts } from '@/app/types/global';

// import { updateUserState } from '@/app/api/server/users/updateUserState';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addProductToCart,
  selectCartData,
  selectCartVersion,
  setCartVersion,
} from '../reducers/CartSlice';
import {
  // addFavorites,
  selectFavoritesItems,
  // selectFavoritesVersion,
  // setFavoritesVersion,
} from '../reducers/FavoritesSlice';

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Контекст аутентификации
 * @property {boolean}     isAuth       - Статус аутентификации
 * @property {boolean}     isLoading    - Статус загрузки
 * @property {string}      userToken    - Токен пользователя
 * @property {IUserEntity} user         - Сущность пользователя
 * @property {void}        authenticate - Функция аутентификации
 * @property {void}        refreshUser  - Функция обновления пользователя
 */
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
 * Провайдер аутентификации
 * @param   {object}      props          - Свойства провайдера аутентификации
 * @param   {ReactNode}   props.children - Дочерний ReactNode
 * @returns {JSX.Element}                Провайдер AuthContext
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  /** Инициализируем функцию dispatch Redux */
  const dispatch = useAppDispatch();
  /** Отслеживаем статус аутентификации */
  const [isAuth, setIsAuth] = useState<boolean>(false);
  /** Отслеживаем статус загрузки */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** Храним данные пользователя */
  const [user, setUser] = useState<IUserEntity | undefined>();
  /** Триггер для повторной загрузки данных пользователя */
  const [refetch, setRefetch] = useState<boolean>(false);
  /** Триггер для обновления пользователя */
  const [refetchUser, setRefetchUser] = useState<boolean>(false);

  /** Получаем данные пользователя из redux AppSelector */
  const cartVersion = useAppSelector(selectCartVersion) as number;
  /** Получаем версию favorites из redux store */
  // const favoritesVersion = useAppSelector(selectFavoritesVersion) as number;
  /** Получаем товары корзины из redux store */
  const productsInCart = useAppSelector(selectCartData);
  const favoritesIds = useAppSelector(
    (state: { favoritesReducer: { products: number[] } }) =>
      selectFavoritesItems(state),
  );

  /**
   * Цикл проверки данных пользователя с polling-интервалом
   *
   * Эта функция проверяет наличие refresh token в local storage и инициирует
   */
  const [trigger, { isError }] = useLazyGetMeQuery({
    pollingInterval: isAuth ? 3000 : 0,
  });

  /**
   * Инициализирует авторизацию проверкой refresh token
   *
   * Эта функция проверяет наличие refresh token в local storage и инициирует
   */
  const onInit = async () => {
    /** Получаем refresh token из localStorage */
    const refresh = localStorage.getItem('refresh-token');

    /** Если refresh token отсутствует — выставляем auth в false */
    if (!refresh) {
      setIsAuth(false);
      return;
    }
    /**
     * Переопределяем сессию пользователя через refresh token.
     * Защищаемся через hasActiveSession — каждый reDefine идёт на /refresh
     * и иначе сжигал бы текущий токен при каждом ре-маунте.
     */
    if (!hasActiveSession()) {
      await reDefine(refresh, getLang());
    }
    /** Проверяем валидность токена */
    await checkToken();
  };

  /**
   * Проверяет refresh token и валидирует аутентификацию пользователя
   *
   * Эта функция триггерит загрузку данных пользователя и валидирует статус
   * аутентификации на основе ответа. Соответственно обновляет состояние auth.
   * @async
   */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- getLang — стабильная функция уровня модуля
  const checkToken = useCallback(async () => {
    /** Триггерим загрузку данных пользователя с текущим langCode из SDK */
    trigger(getLang())
      .then(async (res) => {
        /** Проверяем, есть ли ошибка в ответе или отсутствует user ID */
        if ((res.isError && !res.isLoading) || !res.data?.id) {
          /** Чистим refresh token и выставляем auth в false */
          localStorage.removeItem('refresh-token');
          setIsAuth(false);
        } else {
          /** Сохраняем данные пользователя и выставляем auth в true */
          setUser(res.data);
          setIsAuth(true);
        }
      })
      .catch(async () => {
        /** При ошибке чистим refresh token и выставляем auth в false */
        localStorage.removeItem('refresh-token');
        setIsAuth(false);
      });
  }, [trigger]);

  /**
   * Обновляет состояние пользователя на сервере данными корзины и избранного
   *
   * Эта функция отправляет обновлённое состояние пользователя на сервер,
   * включая данные корзины и избранного.
   */
  const updateUserData = async (): Promise<void> => {
    /** Выходим, если данных пользователя нет */
    if (!user) {
      return;
    }
    /** Отправляем обновлённое состояние пользователя на сервер */
    // await updateUserState({
    //   cart: productsInCart,
    //   favorites: favoritesIds,
    //   user: user,
    // });
  };

  /** Обновляем данные пользователя при изменении состояния auth */
  useEffect(() => {
    /** Выходим, если не аутентифицирован или нет user */
    if (!isAuth || !user) {
      return;
    }
    /** Обновляем данные пользователя текущей корзиной и избранным */
    updateUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, productsInCart, favoritesIds]);

  /** Загружаем корзину из состояния пользователя в Redux store */
  useEffect(() => {
    /** Выходим, если нет данных корзины пользователя или корзина уже загружена */
    if (!user?.state.cart || cartVersion > 0) {
      return;
    }

    /** Добавляем каждый товар из состояния пользователя в корзину Redux */
    (user.state.cart as IProducts[] | undefined)?.forEach((product) => {
      const productInCart = productsInCart?.find(
        (p: { id: number }) => p.id === product.id,
      );
      /** Если товара в корзине нет — добавляем */
      if (!productInCart) {
        // Редьюсер ожидает `{ id, selected, quantity }`; без quantity здесь
        // QuantitySelector в корзине скрывается, а тоталы остаются $0.
        dispatch(
          addProductToCart({ id: product.id, selected: true, quantity: 1 }),
        );
      }
    });

    /** Помечаем корзину как загруженную */
    dispatch(setCartVersion(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, dispatch, productsInCart]);

  // Перезапрос
  useEffect(() => {
    // Существующий паттерн: синхронный setState в теле эффекта, чтобы пометить
    // «loading» до старта асинхронного onInit. Рефакторинг в derived state —
    // вне scope-а задачи на выравнивание под OneEntry SDK.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    onInit().then(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  // Refetch если ошибка и есть refresh-token
  useEffect(() => {
    const refresh = localStorage.getItem('refresh-token');
    if (isError && refresh) {
      // Существующая реактивная цепочка setState — архитектурно не трогаем;
      // правильный фикс — поднять её в обработчик события.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefetch(true);
      localStorage.removeItem('refresh-token');
      setIsAuth(false);
    }
  }, [isError]);

  // Проверяем токен при refetch
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
