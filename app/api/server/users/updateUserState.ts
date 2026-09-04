import type { IAuthFormData, IUserEntity } from 'oneentry/types';

import { getApi, isError } from '@/app/api/api/api';
import type { IProducts } from '@/app/types/global';

/**
 * updateUserState — updates the user's state via the Users API.
 *
 * @param   {object}                  props           - Update arguments.
 * @param   {number[]}                props.favorites - Favorite product ids to persist into `user.state.favorites`.
 * @param   {IProducts[]}             props.cart      - Cart line items to persist into `user.state.cart`.
 * @param   {IUserEntity | undefined} props.user      - Current user entity (no-op when undefined).
 * @returns Promise resolving to `true` on success, `false` on failure, or `undefined` when called without a user.
 */
export const updateUserState = async ({
  favorites,
  cart,
  user,
}: {
  favorites: number[];
  cart: IProducts[];
  user: IUserEntity | undefined;
}) => {
  if (!user) {
    return;
  }
  const hasMarker = (item: unknown): item is { marker: string; value: unknown } =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as { marker?: unknown }).marker === 'string';

  const formData: IAuthFormData[] = user.formData
    .filter(hasMarker)
    .filter(item => item.marker !== 'otp_code')
    .map(item => ({
      marker: item.marker,
      type: 'string',
      value: String(item.value ?? ''),
    }));

  try {
    const fresh = await getApi().Users.getUser();
    if (!fresh || isError(fresh)) {
      return false;
    }
    const freshUser = fresh as IUserEntity;

    // No notificationData: a state-only sync must not touch notification prefs, and
    // OAuth-created users have no notification record server-side — PUT /me 500s on it.
    const res = await getApi().Users.updateUser({
      formIdentifier: freshUser.formIdentifier,
      formData: [...formData],
      state: {
        ...freshUser.state,
        favorites,
        cart,
      },
    });

    if (!res || isError(res)) {
      return false;
    }

    return res === true;
  } catch {
    return false;
  }
};

/**
 * clearUserState — resets the user's `favorites` and `cart` state to empty.
 *
 * @param   {IUserEntity} user - Current user entity whose state should be cleared.
 * @returns Promise that resolves once the empty state is persisted.
 */
export const clearUserState = async (user: IUserEntity) => {
  updateUserState({ favorites: [], cart: [], user: user });
};
