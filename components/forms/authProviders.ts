import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

// Fallback for when the OneEntry admin leaves the `google` provider's
// `config.oauthAuthUrl` empty — the provider itself is the source of truth
// for the URL, see `startGoogleOAuth(authUrl)`.
const GOOGLE_AUTH_URL_FALLBACK = 'https://accounts.google.com/o/oauth2/v2/auth';

// Inlined at build time. When the env var is missing the Google button is
// filtered out of the provider list (see `sortActiveAuthProviders`), so the
// user never sees a dead button.
const IS_GOOGLE_OAUTH_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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

/**
 * getProviderMeta — resolves UI metadata (label, icon) for an auth provider, with email fallback.
 *
 * @param   {IAuthProvidersEntity} p - OneEntry auth-provider entity.
 * @returns Display metadata for the provider button.
 */
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

/**
 * sortActiveAuthProviders — filters to active providers and sorts them by the project's preferred order.
 *
 * @param   {IAuthProvidersEntity[]} providers - Auth providers from the OneEntry SDK.
 * @returns Active providers sorted with email first, google second, others after.
 */
export const sortActiveAuthProviders = (
  providers: IAuthProvidersEntity[]
): IAuthProvidersEntity[] => {
  return providers
    .filter(p => p.isActive)
    .filter(p => p.identifier !== 'google' || IS_GOOGLE_OAUTH_CONFIGURED)
    .slice()
    .sort((a, b) => {
      const ra = ORDER_RANK[a.identifier] ?? 99;
      const rb = ORDER_RANK[b.identifier] ?? 99;
      return ra - rb;
    });
};

/**
 * startGoogleOAuth — starts the Google OAuth redirect.
 *
 * @param   {string | null} [authUrl] - Optional OAuth authorization URL from the OneEntry admin.
 * @returns `true` when the redirect was initiated, `false` when the OAuth client id is missing.
 */
export const startGoogleOAuth = (authUrl?: string | null): boolean => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return false;
  const state = crypto.randomUUID();
  sessionStorage.setItem('google-oauth-state', state);
  const currentPath = window.location.pathname + window.location.search;
  if (!currentPath.startsWith('/auth/callback/')) {
    sessionStorage.setItem('google-oauth-return', currentPath);
  }
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
