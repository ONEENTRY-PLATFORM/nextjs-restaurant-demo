'use client';

import { useGetAuthProvidersQuery } from '@/app/api';
import { findEmailLikeProvider } from '@/components/forms/authProviders';

/**
 * useEmailAuthProviderMarker — resolves the marker of the active email-or-phone auth provider
 *
 * @returns Identifier of the active email-or-phone provider, defaulting to `'email'`.
 */
export const useEmailAuthProviderMarker = (): string => {
  const { data: providers } = useGetAuthProvidersQuery('');
  return findEmailLikeProvider(providers ?? [])?.identifier ?? 'email';
};
