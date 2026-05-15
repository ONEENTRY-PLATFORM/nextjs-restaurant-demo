import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getApi, isError, syncTokens } from '@/app/api';

type LogInProps = { method: string; login: string; password: string };

/**
 * logInUser — user sign-in via the AuthProvider API.
 *
 * @param   {LogInProps} props          - Sign-in arguments.
 * @param   {string}     props.method   - Auth-provider marker (e.g. `email`).
 * @param   {string}     props.login    - User identifier (email).
 * @param   {string}     props.password - User password.
 * @returns Promise resolving to `{ data }` with the auth entity on success or `{ error }` on failure.
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
