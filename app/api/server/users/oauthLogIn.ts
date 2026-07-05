'use server';

import { defineOneEntry } from 'oneentry';
import type { IAuthEntity, IOauthData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IError } from 'oneentry/dist/base/utils';

const PROJECT_URL = (process.env.NEXT_PUBLIC_ONEENTRY_URL ||
  process.env.NEXT_PUBLIC_PROJECT_URL) as string;
const APP_TOKEN = (process.env.NEXT_PUBLIC_ONEENTRY_TOKEN ||
  process.env.NEXT_PUBLIC_APP_TOKEN) as string;

type OauthLoginProps = {
  marker: string;
  code: string;
  redirectUri: string;
  deviceMetadata?: string;
};

/**
 * oauthLogIn — exchanges an OAuth authorization code for a OneEntry session.
 *
 * Runs server-side (the client secret must not reach the browser) on a fresh
 * SDK instance configured with the browser's `deviceMetadata`: OneEntry binds
 * the issued refresh token to the `x-device-metadata` fingerprint, so a
 * server-stamped fingerprint would make the token impossible to refresh from
 * the browser (400 "Provided token is incorrect" on reload).
 *
 * @param   {OauthLoginProps} props                  - OAuth exchange arguments.
 * @param   {string}          props.marker           - OAuth provider marker (currently `google`).
 * @param   {string}          props.code             - Authorization code returned by the provider's redirect.
 * @param   {string}          props.redirectUri      - Redirect URI registered for the OAuth client.
 * @param   {string}          [props.deviceMetadata] - Browser's `x-device-metadata` string (from `getDeviceMetadata()`).
 * @returns Promise resolving to `{ data }` with the auth entity on success or `{ error }` on failure.
 */
export const oauthLogIn = async ({
  marker,
  code,
  redirectUri,
  deviceMetadata,
}: OauthLoginProps) => {
  try {
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

    // per-request instance: deviceMetadata is per-visitor state and must not
    // leak between concurrent exchanges through a shared singleton
    const { AuthProvider } = defineOneEntry(PROJECT_URL, {
      token: APP_TOKEN,
      ...(deviceMetadata !== undefined && { deviceMetadata }),
    });

    const result = await AuthProvider.oauth(marker, body);
    const auth = result as IAuthEntity;
    if (auth?.accessToken && auth?.refreshToken) {
      return { data: auth };
    }
    return { error: (result as IError)?.message || 'OAuth authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
