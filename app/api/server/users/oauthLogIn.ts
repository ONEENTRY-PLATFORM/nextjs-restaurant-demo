'use server';

import type { IAuthEntity, IOauthData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getApi, isError } from '@/app/api';

type OauthLoginProps = {
  marker: string;
  code: string;
  redirectUri: string;
};

/**
 * oauthLogIn — exchanges an OAuth authorization code for a OneEntry session.
 *
 * Server action only — `client_secret` must not end up in the browser bundle.
 * Analogous to {@link logInUser}, but via `AuthProvider.oauth(...)` (OAuth providers are not bound to a form).
 *
 * @param   {OauthLoginProps} props             - OAuth exchange arguments.
 * @param   {string}          props.marker      - OAuth provider marker (currently `google`).
 * @param   {string}          props.code        - Authorization code returned by the provider's redirect.
 * @param   {string}          props.redirectUri - Redirect URI registered for the OAuth client.
 * @returns Promise resolving to `{ data }` with the auth entity on success or `{ error }` on failure.
 */
export const oauthLogIn = async ({ marker, code, redirectUri }: OauthLoginProps) => {
  try {
    // This server action is wired up only for the Google OAuth callback (the only
    // OAuth provider with a code-exchange step in this project). The `marker` is
    // forwarded to `AuthProvider.oauth(marker, body)` so OneEntry knows which
    // provider entity to authenticate against.
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { error: `OAuth credentials are not configured for "${marker}".` };
    }

    const body: IOauthData = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    const result = await getApi().AuthProvider.oauth(marker, body);
    if (!isError(result)) {
      const auth = result as IAuthEntity;
      if (auth.accessToken && auth.refreshToken) {
        return { data: auth };
      }
    }
    return { error: 'OAuth authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
