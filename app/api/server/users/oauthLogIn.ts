'use server';

import type {
  IAuthEntity,
  IOauthData,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { api, isError } from '@/app/api';

type OauthLoginProps = {
  marker: string;
  code: string;
  redirectUri: string;
};

/**
 * Exchange an OAuth authorization code for a OneEntry session.
 *
 * Server-only — `client_secret` must never reach the browser bundle.
 * Mirrors {@link logInUser} but calls `AuthProvider.oauth(...)` instead
 * of `auth(...)` (the OAuth providers in OneEntry are not form-backed).
 */
export const oauthLogIn = async ({
  marker,
  code,
  redirectUri,
}: OauthLoginProps) => {
  try {
    const clientId =
      marker === 'google' ? process.env.GOOGLE_CLIENT_ID : undefined;
    const clientSecret =
      marker === 'google' ? process.env.GOOGLE_CLIENT_SECRET : undefined;

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

    const result = await api.AuthProvider.oauth(marker, body);
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
