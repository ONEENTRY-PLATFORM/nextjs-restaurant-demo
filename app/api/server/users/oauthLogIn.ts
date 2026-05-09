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
 */
export const oauthLogIn = async ({ marker, code, redirectUri }: OauthLoginProps) => {
  try {
    const clientId = marker === 'google' ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID : undefined;
    const clientSecret = marker === 'google' ? process.env.GOOGLE_CLIENT_SECRET : undefined;

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
