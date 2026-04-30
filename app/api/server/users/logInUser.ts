import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { api, isError } from '@/app/api';

type LogInProps = { method: string; login: string; password: string };

/**
 * Авторизация пользователя через API AuthProvider.
 */
export const logInUser = async ({ method, login, password }: LogInProps) => {
  try {
    // Маркеры должны совпадать с полями формы, связанной с auth-провайдером:
    // проверено через /inspect-api auth-providers — провайдер `email` связан
    // с формой `user`, у которой login-поле имеет маркер `email` (isLogin=true),
    // а password-поле — маркер `password` (isPassword=true).
    const preparedData: IAuthPostBody = {
      authData: [
        {
          marker: 'email',
          value: login,
        },
        {
          marker: 'password',
          value: password,
        },
      ],
    };
    const result = await api.AuthProvider.auth(method, preparedData);
    if (!isError(result)) {
      const auth = result as IAuthEntity;
      if (auth.accessToken && auth.refreshToken) {
        return { data: auth };
      }
    }
    return { error: 'Authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
