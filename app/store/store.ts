import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { persistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

import { RTKApi } from '../api';
import animationsSlice from './reducers/AnimationsSlice';
import cartSlice from './reducers/CartSlice';
import favoritesSlice from './reducers/FavoritesSlice';
import formFieldsSlice from './reducers/FormFieldsSlice';
import orderSlice from './reducers/OrderSlice';

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: number) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();
const version = 1;

const cartReducer = persistReducer(
  {
    key: 'cart-slice',
    storage: storage,
    version: version,
    whitelist: ['productsData', 'reservations'],
  },
  cartSlice
);

const favoritesReducer = persistReducer(
  {
    key: 'favorites-slice',
    storage: storage,
    version: version,
    whitelist: ['products'],
  },
  favoritesSlice
);

const formFieldsReducer = persistReducer(
  {
    key: 'form-fields',
    storage: storage,
    version: version,
    whitelist: ['fields'],
  },
  formFieldsSlice
);

const orderReducer = persistReducer(
  {
    key: 'order-slice',
    storage: storage,
    version: version,
    whitelist: ['products'],
  },
  orderSlice
);

const rootReducer = combineReducers({
  cartReducer,
  orderReducer,
  favoritesReducer,
  formFieldsReducer,
  animationsSlice,
  [RTKApi.reducerPath]: RTKApi.reducer,
});

/**
 * Настраивает Redux store с persist-ом.
 *
 * @see {@link https://github.com/rt2zz/redux-persist?tab=readme-ov-file#nested-persists}
 */
export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(RTKApi.middleware),
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<AppStore>(setupStore, { debug: false });
