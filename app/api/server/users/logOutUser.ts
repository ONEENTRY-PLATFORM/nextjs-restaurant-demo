import {
  getApi,
  getStoredAuthProviderMarker,
  isError,
  saveAuthProviderMarker,
} from '@/app/api/api/api';

type LogOutProps = { marker: string; token?: string };

/**
 * logOutUser — user sign-out via the AuthProvider API.
 *
 * The stored provider marker of the active session (e.g. `google` after OAuth)
 * takes precedence over the passed one, so the token is revoked on the provider
 * that actually issued it.
 *
 * @param   {LogOutProps} props        - Sign-out arguments.
 * @param   {string}      props.marker - Fallback auth-provider marker (e.g. `email`) when none is stored.
 * @returns Promise resolving to `{ data }` on success, `{ error }` on failure.
 */
export const logOutUser = async ({ marker }: LogOutProps) => {
  try {
    const token = localStorage.getItem('refresh-token');
    if (!token) {
      throw Error('No token provided');
    }
    const providerMarker = getStoredAuthProviderMarker() || marker;
    const result = await getApi().AuthProvider.logout(providerMarker, token);
    // The local session is dropped regardless of the server verdict: a revoked /
    // already-invalid refresh token must not survive in localStorage, otherwise
    // every re-init retries refresh(400)/me(401) in a loop.
    localStorage.removeItem('refresh-token');
    saveAuthProviderMarker('');
    if (isError(result)) {
      return { error: (result.message as unknown as string) ?? 'Logout failed' };
    }
    return { data: result };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
};
