'use client';

import { useGetAuthProvidersQuery } from '@/app/api';
import { findEmailLikeProvider } from '@/components/forms/authProviders';

/**
 * useEmailAuthProviderMarker — resolves the marker of the active email-or-phone auth provider
 * from `AuthProvider.getAuthProviders()`. The UI routes both `email` and `phone` providers
 * through `SignInForm`, so either one is acceptable for password-based flows
 * (`AuthProvider.auth` / `signUp` / `generateCode` / `checkCode` / `activateUser` / `changePassword` / `logout`).
 *
 * Falls back to `'email'` while the providers query is in flight or when the admin has no
 * email-like provider configured — the call sites are defensive, but the fallback keeps form
 * submission code paths well-typed.
 *
 * @returns Identifier of the active email-or-phone provider, defaulting to `'email'`.
 */
export const useEmailAuthProviderMarker = (): string => {
  const { data: providers } = useGetAuthProvidersQuery('');
  return findEmailLikeProvider(providers ?? [])?.identifier ?? 'email';
};
