import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getApi, isError, syncTokens } from '@/app/api';

type LogInProps = { method: string; login: string; password: string };

/**
 * Авторизация пользователя через API AuthProvider.
 *
 * После успешного `auth()` SDK НЕ кладёт токены в свой state автоматически —
 * нужно сделать это руками через `syncTokens`, иначе следующий
 * auth-protected POST уйдёт без `Authorization` и сервер вернёт
 * `400 "You must authorize to send data"` (SDK ретраит только 401).
 * См. правило MCP `tokens` (раздел «syncTokens — mandatory pattern»).
 */
export const logInUser = async ({ method, login, password }: LogInProps) => {
  try {
    const preparedData: IAuthPostBody = {
      authData: [
        { marker: 'email', value: login },
        { marker: 'password', value: password },
      ],
    };
    const result = await getApi().AuthProvider.auth(method, preparedData);
    if (!isError(result)) {
      const auth = result as IAuthEntity;
      if (auth.accessToken && auth.refreshToken) {
        syncTokens(auth.accessToken, auth.refreshToken);
        return { data: auth };
      }
    }
    return { error: 'Authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
