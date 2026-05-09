import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

// Fallback for when the OneEntry admin leaves the `google` provider's
// `config.oauthAuthUrl` empty — the provider itself is the source of truth
// for the URL, see `startGoogleOAuth(authUrl)`.
const GOOGLE_AUTH_URL_FALLBACK = 'https://accounts.google.com/o/oauth2/v2/auth';

export type ProviderMeta = {
  label: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
};

const PROVIDER_META: Record<string, ProviderMeta> = {
  email: {
    label: 'Login With Email',
    icon: '/images/icons/login-email.svg',
    iconWidth: 24,
    iconHeight: 22,
  },
  google: {
    label: 'Login With Google',
    icon: '/images/icons/login-google.svg',
    iconWidth: 24,
    iconHeight: 24,
  },
};

const ORDER_RANK: Record<string, number> = {
  email: 0,
  google: 1,
};

export const getProviderMeta = (p: IAuthProvidersEntity): ProviderMeta => {
  return (
    PROVIDER_META[p.identifier] ?? {
      label:
        (p.localizeInfos as { title?: string } | undefined)?.title ?? `Login With ${p.identifier}`,
      icon: '/images/icons/login-email.svg',
      iconWidth: 24,
      iconHeight: 22,
    }
  );
};

export const sortActiveAuthProviders = (
  providers: IAuthProvidersEntity[]
): IAuthProvidersEntity[] => {
  return providers
    .filter(p => p.isActive)
    .slice()
    .sort((a, b) => {
      const ra = ORDER_RANK[a.identifier] ?? 99;
      const rb = ORDER_RANK[b.identifier] ?? 99;
      return ra - rb;
    });
};

/**
 * Starts the Google OAuth redirect. `authUrl` is read from
 * `provider.config.oauthAuthUrl` (OneEntry admin) — if it is `null`/empty,
 * falls back to `GOOGLE_AUTH_URL_FALLBACK`.
 *
 * Returns `false` when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set
 * (see MISMATCH-LOG.md §C.8.1) — in that case the caller must fall back
 * to email login.
 */
export const startGoogleOAuth = (authUrl?: string | null): boolean => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return false;
  const state = crypto.randomUUID();
  sessionStorage.setItem('google-oauth-state', state);
  const redirectUri = `${window.location.origin}/auth/callback/google`;
  const search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  window.location.href = `${authUrl || GOOGLE_AUTH_URL_FALLBACK}?${search.toString()}`;
  return true;
};
