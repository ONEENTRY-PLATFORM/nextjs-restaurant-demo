'use client';

import type {
  IAuthEntity,
  IAuthPostBody,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getApi, isError, saveAuthProviderMarker } from '@/app/api';

type LogInProps = {
  method: string;
  login: string;
  password: string;
  loginMarker?: string;
  passwordMarker?: string;
};

/**
 * logInUser — user sign-in via the AuthProvider API.
 *
 * @param   {LogInProps} props                - Sign-in arguments.
 * @param   {string}     props.method         - Auth-provider marker (e.g. `email`).
 * @param   {string}     props.login          - User identifier (login field value).
 * @param   {string}     props.password       - User password.
 * @param   {string}     [props.loginMarker]  - Marker of the `isLogin` field; defaults to `email`.
 * @param   {string}     [props.passwordMarker] - Marker of the `isPassword` field; defaults to `password`.
 * @returns Promise resolving to `{ data }` with the auth entity on success or `{ error }` on failure.
 */
export const logInUser = async ({
  method,
  login,
  password,
  loginMarker = 'email',
  passwordMarker = 'password',
}: LogInProps) => {
  try {
    const preparedData: IAuthPostBody = {
      authData: [
        { marker: loginMarker, value: login },
        { marker: passwordMarker, value: password },
      ],
    };
    const result = await getApi().AuthProvider.auth(method, preparedData);
    if (!isError(result)) {
      const auth = result as IAuthEntity;
      if (auth.accessToken && auth.refreshToken) {
        // `auth()` already stores both tokens in the SDK instance and calls saveFunction —
        // manual syncTokens is only needed on the oauth() path.
        saveAuthProviderMarker(method);
        return { data: auth };
      }
    }
    return { error: 'Authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
