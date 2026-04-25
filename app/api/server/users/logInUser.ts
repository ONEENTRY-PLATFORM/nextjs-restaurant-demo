import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { api, isError } from '@/app/api';

type LogInProps = { method: string; login: string; password: string };

/**
 * User authorization with API AuthProvider
 */
export const logInUser = async ({ method, login, password }: LogInProps) => {
  try {
    // Markers must match the form fields tied to the auth provider:
    // verified via /inspect-api auth-providers — `email` provider links to
    // form `user` whose login field has marker `email` (isLogin=true) and
    // password field has marker `password` (isPassword=true).
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
