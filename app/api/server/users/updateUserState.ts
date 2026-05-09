import type { IAuthFormData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';

import { getApi } from '@/app/api';
import type { IProducts } from '@/app/types/global';
import { normalizePhoneE164 } from '@/components/utils';

/**
 * updateUserState — обновляет state пользователя через API Users.
 *
 * MCP-правило `user.state`: перед `updateUser` обязательно перезапросить свежего пользователя
 * (`getUser`) и спредить его `state`, иначе параллельные изменения в другой вкладке/устройстве
 * перезатрутся. `formIdentifier` тоже из свежего ответа, не хардкодится.
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
  const formData: IAuthFormData[] = user.formData
    .filter(item => item.marker !== 'otp_code')
    .map(item => ({
      marker: item.marker as string,
      type: 'string',
      value: item.value as string,
    }));
  const email = user.formData.find(item => item.marker === 'email');
  const phone = user.formData.find(item => item.marker === 'phone');

  const fresh = (await getApi().Users.getUser()) as IUserEntity | IError;
  if (!fresh || (fresh as IError)?.statusCode) {
    return false;
  }
  const freshUser = fresh as IUserEntity;

  const res = await getApi().Users.updateUser({
    formIdentifier: freshUser.formIdentifier,
    formData: [...formData],
    state: {
      ...freshUser.state,
      favorites,
      cart,
    },
    notificationData: {
      email: email?.value as string,
      phonePush: [],
      phoneSMS: normalizePhoneE164(phone?.value as string | undefined),
    },
  });

  if (!res || (res as IError)?.statusCode) {
    return false;
  }

  if (res === true) {
    return true;
  }

  return false;
};

export const clearUserState = async (user: IUserEntity) => {
  updateUserState({ favorites: [], cart: [], user: user });
};
