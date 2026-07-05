'use server';

import type { IAuthEntity, IOauthData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

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
 * Deliberately a raw fetch instead of the SDK: the exchange runs server-side
 * (the client secret must not reach the browser), but OneEntry binds the issued
 * refresh token to the `x-device-metadata` fingerprint of the request. The SDK
 * would stamp the server's fingerprint, making the token impossible to refresh
 * from the browser (400 "Provided token is incorrect" on reload) — so the
 * browser's metadata string is forwarded instead.
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

    const response = await fetch(
      `${PROJECT_URL}/api/content/users-auth-providers/marker/${marker}/oauth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-token': APP_TOKEN,
          ...(deviceMetadata ? { 'x-device-metadata': deviceMetadata } : {}),
        },
        body: JSON.stringify(body),
      }
    );
    const result = (await response.json()) as IAuthEntity & { message?: string };
    if (response.ok && result?.accessToken && result?.refreshToken) {
      return { data: result as IAuthEntity };
    }
    return { error: result?.message || 'OAuth authentication failed' };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
