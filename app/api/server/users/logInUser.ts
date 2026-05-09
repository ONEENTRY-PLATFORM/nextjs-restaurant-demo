import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getApi, isError, syncTokens } from '@/app/api';

type LogInProps = { method: string; login: string; password: string };

/**
 * logInUser — авторизация пользователя через API AuthProvider.
 *
 * Несмотря на путь `app/api/server/...`, файл НЕ `'use server'` — исполняется на клиенте
 * (вызывается из `'use client'`-форм). По MCP-правилу `AuthProvider.auth/signUp/generateCode/checkCode`
 * обязаны быть client-side, иначе fingerprint берётся серверный.
 * После `auth()` SDK не кладёт токены в state — обязателен `syncTokens`, иначе следующий
 * auth-protected POST уйдёт без `Authorization` и упадёт 400 (SDK ретраит только 401).
 * См. MCP-правило `tokens` (syncTokens — mandatory pattern).
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
