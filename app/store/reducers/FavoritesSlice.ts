import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

type InitialStateType = {
  products: number[];
  version: number;
};
const initialState: InitialStateType = {
  products: [],
  version: 0,
};

export const favoritesSlice = createSlice({
  name: 'favorites-slice',
  initialState,
  reducers: {
    addFavorites(state, action: PayloadAction<number>) {
      const isUnique = state.products.findIndex((productId: number) => {
        return productId === action.payload;
      });
      if (isUnique === -1) {
        state.products.push(action.payload);
      }
    },
    removeFavorites(state, action: PayloadAction<number>) {
      state.products = state.products.filter((product: number) => product !== action.payload);
    },
    removeAllFavorites(state) {
      state.products = initialState.products;
    },
    setFavoritesVersion(state, action: PayloadAction<number>) {
      state.version = action.payload;
    },
  },
});

export const { addFavorites, removeFavorites, removeAllFavorites, setFavoritesVersion } =
  favoritesSlice.actions;

/**
 * selectFavoritesItems — selector for the list of favorite product ids.
 *
 * @param   {{ favoritesReducer: { products: number[] } }} state - Redux root state.
 * @returns {number[]}                                            Array of favorite product ids.
 */
export const selectFavoritesItems = (state: { favoritesReducer: { products: number[] } }) =>
  state.favoritesReducer.products;

/**
 * selectIsFavorites — selector "is in favorites" by product id.
 *
 * @param   {{ favoritesReducer: { products: number[] } }} state - Redux root state.
 * @param   {number}                                       id    - Product id to look up.
 * @returns {boolean}                                            `true` when the product id is currently in the favorites list.
 */
export const selectIsFavorites = (
  state: { favoritesReducer: { products: number[] } },
  id: number
): boolean => {
  const added = state.favoritesReducer.products.findIndex((product: number) => product === id);
  if (added === -1) {
    return false;
  }
  return true;
};

/**
 * selectFavoritesVersion — selector for the favorites version (bumps on persisted-state replays).
 *
 * @param   {{ favoritesReducer: { version: number } }} state - Redux root state.
 * @returns {number}                                           Monotonic version counter for the favorites slice.
 */
export const selectFavoritesVersion = (state: { favoritesReducer: { version: number } }) =>
  state.favoritesReducer.version;

export default favoritesSlice.reducer;
