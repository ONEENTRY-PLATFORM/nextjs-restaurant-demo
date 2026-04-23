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
 * Authentication context
 * @property {boolean}     isAuth       - Authentication status
 * @property {boolean}     isLoading    - Loading status
 * @property {string}      userToken    - User token
 * @property {IUserEntity} user         - User entity
 * @property {void}        authenticate - Authentication function
 * @property {void}        refreshUser  - User refresh function
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
 * Auth provider
 * @param   {object}      props          - Auth provider properties
 * @param   {ReactNode}   props.children - Children ReactNode
 * @returns {JSX.Element}                AuthContext Provider
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  /** Initialize Redux dispatch function */
  const dispatch = useAppDispatch();
  /** Track authentication status */
  const [isAuth, setIsAuth] = useState<boolean>(false);
  /** Track loading status */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** Store user data */
  const [user, setUser] = useState<IUserEntity | undefined>();
  /** Trigger refetch of user data */
  const [refetch, setRefetch] = useState<boolean>(false);
  /** Trigger user refresh */
  const [refetchUser, setRefetchUser] = useState<boolean>(false);

  /** Get user data from redux AppSelector */
  const cartVersion = useAppSelector(selectCartVersion) as number;
  /** Get favorites version from redux store */
  // const favoritesVersion = useAppSelector(selectFavoritesVersion) as number;
  /** Get products in cart from redux store */
  const productsInCart = useAppSelector(selectCartData);
  const favoritesIds = useAppSelector(
    (state: { favoritesReducer: { products: number[] } }) =>
      selectFavoritesItems(state),
  );

  /**
   * Check user data loop with polling interval
   *
   * This function checks for a refresh token in local storage and initiates
   */
  const [trigger, { isError }] = useLazyGetMeQuery({
    pollingInterval: isAuth ? 3000 : 0,
  });

  /**
   * Initialize authorization by checking refresh token
   *
   * This function checks for a refresh token in local storage and initiates
   */
  const onInit = async () => {
    /** Get refresh token from localStorage */
    const refresh = localStorage.getItem('refresh-token');

    /** If no refresh token, set auth to false */
    if (!refresh) {
      setIsAuth(false);
      return;
    }
    /**
     * Redefine user session with refresh token.
     * Guard with hasActiveSession — each reDefine hits /refresh and would
     * otherwise burn the current token on every re-mount.
     */
    if (!hasActiveSession()) {
      await reDefine(refresh, getLang());
    }
    /** Check token validity */
    await checkToken();
  };

  /**
   * Check refresh token and validate user authentication
   *
   * This function triggers the user data fetch and validates the authentication
   * status based on the response. It updates the authentication state accordingly.
   * @async
   */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- getLang is a stable module-level function
  const checkToken = useCallback(async () => {
    /** Trigger user data fetch using the SDK's current langCode */
    trigger(getLang())
      .then(async (res) => {
        /** Check if response has error or no user ID */
        if ((res.isError && !res.isLoading) || !res.data?.id) {
          /** Clear refresh token and set auth to false */
          localStorage.removeItem('refresh-token');
          setIsAuth(false);
        } else {
          /** Set user data and auth status to true */
          setUser(res.data);
          setIsAuth(true);
        }
      })
      .catch(async () => {
        /** Clear refresh token and set auth to false on error */
        localStorage.removeItem('refresh-token');
        setIsAuth(false);
      });
  }, [trigger]);

  /**
   * Update user state on server with cart and favorites data
   *
   * This function sends the updated user state to the server,
   * including the cart and favorites data.
   */
  const updateUserData = async (): Promise<void> => {
    /** Exit if no user data */
    if (!user) {
      return;
    }
    /** Send updated user state to server */
    // await updateUserState({
    //   cart: productsInCart,
    //   favorites: favoritesIds,
    //   user: user,
    // });
  };

  /** Update user data on auth state change */
  useEffect(() => {
    /** Exit if not authenticated or no user */
    if (!isAuth || !user) {
      return;
    }
    /** Update user data with current cart and favorites */
    updateUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, productsInCart, favoritesIds]);

  /** Load cart from user state to Redux store */
  useEffect(() => {
    /** Exit if no user cart data or cart already loaded */
    if (!user?.state.cart || cartVersion > 0) {
      return;
    }

    /** Add each product from user state to Redux cart */
    (user.state.cart as IProducts[] | undefined)?.forEach((product) => {
      const productInCart = productsInCart?.find(
        (p: { id: number }) => p.id === product.id,
      );
      /** If product not in cart, add to cart */
      if (!productInCart) {
        dispatch(addProductToCart(product));
      }
    });

    /** Mark cart as loaded */
    dispatch(setCartVersion(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, user, dispatch, productsInCart]);

  // Refetch
  useEffect(() => {
    // Pre-existing pattern: sync setState in effect body to signal "loading"
    // before starting async onInit. Refactoring to derived state is out of
    // scope for the OneEntry SDK alignment task.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    onInit().then(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  // Refetch if error and has refresh-token
  useEffect(() => {
    const refresh = localStorage.getItem('refresh-token');
    if (isError && refresh) {
      // Pre-existing reactive setState chain — architecturally unchanged;
      // proper fix would hoist to an event handler.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefetch(true);
      localStorage.removeItem('refresh-token');
      setIsAuth(false);
    }
  }, [isError]);

  // Check token on refetch
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
