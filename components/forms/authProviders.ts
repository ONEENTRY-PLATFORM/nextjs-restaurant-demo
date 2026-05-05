import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

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
 * Запускает Google OAuth-редирект. Возвращает `false`, если
 * `NEXT_PUBLIC_GOOGLE_CLIENT_ID` не задан (см. MISMATCH-LOG.md §C.8.1) —
 * в этом случае вызывающая сторона должна сделать fallback на email-логин.
 */
export const startGoogleOAuth = (): boolean => {
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
  window.location.href = `${GOOGLE_AUTH_URL}?${search.toString()}`;
  return true;
};
