import { describe, expect, it } from '@jest/globals';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

import { getProviderMeta, sortActiveAuthProviders } from '../authProviders';

/**
 * mkProvider — builds a minimal `IAuthProvidersEntity` for tests.
 *
 * @param   {string}                       identifier - Provider identifier (e.g. `email`, `google`, `github`).
 * @param   {Partial<IAuthProvidersEntity>} extra      - Overrides for `isActive`/`localizeInfos`/etc.
 * @returns A provider entity that satisfies the SDK shape for these tests.
 */
const mkProvider = (
  identifier: string,
  extra: Partial<IAuthProvidersEntity> = {}
): IAuthProvidersEntity =>
  ({
    identifier,
    isActive: true,
    ...extra,
  }) as unknown as IAuthProvidersEntity;

describe('getProviderMeta', () => {
  it('returns the bundled meta for the `email` provider', () => {
    const meta = getProviderMeta(mkProvider('email'));
    expect(meta).toEqual({
      label: 'Login With Email',
      icon: '/images/icons/login-email.svg',
      iconWidth: 24,
      iconHeight: 22,
    });
  });

  it('returns the bundled meta for the `google` provider', () => {
    const meta = getProviderMeta(mkProvider('google'));
    expect(meta.label).toBe('Login With Google');
    expect(meta.icon).toBe('/images/icons/login-google.svg');
    expect(meta.iconWidth).toBe(24);
    expect(meta.iconHeight).toBe(24);
  });

  it('falls back to localizeInfos.title for unknown providers', () => {
    const meta = getProviderMeta(
      mkProvider('github', { localizeInfos: { title: 'Login With GitHub' } } as never)
    );
    expect(meta.label).toBe('Login With GitHub');
    expect(meta.icon).toBe('/images/icons/login-email.svg'); // generic fallback icon
  });

  it('falls back to "Login With <identifier>" when localizeInfos has no title', () => {
    const meta = getProviderMeta(mkProvider('apple'));
    expect(meta.label).toBe('Login With apple');
  });
});

describe('sortActiveAuthProviders', () => {
  it('drops inactive providers', () => {
    const result = sortActiveAuthProviders([
      mkProvider('email', { isActive: false }),
      mkProvider('google'),
    ]);
    expect(result.map(p => p.identifier)).toEqual(['google']);
  });

  it('sorts email first, google second, others after', () => {
    const result = sortActiveAuthProviders([
      mkProvider('github'),
      mkProvider('google'),
      mkProvider('email'),
    ]);
    expect(result.map(p => p.identifier)).toEqual(['email', 'google', 'github']);
  });

  it('preserves the relative order of unknown providers (stable sort)', () => {
    const result = sortActiveAuthProviders([
      mkProvider('apple'),
      mkProvider('github'),
      mkProvider('email'),
    ]);
    // email pinned first; apple/github keep their input order (both rank 99).
    expect(result.map(p => p.identifier)).toEqual(['email', 'apple', 'github']);
  });

  it('does not mutate the input array', () => {
    const input = [mkProvider('github'), mkProvider('email')];
    const before = input.map(p => p.identifier);
    sortActiveAuthProviders(input);
    expect(input.map(p => p.identifier)).toEqual(before);
  });

  it('returns [] for an empty input', () => {
    expect(sortActiveAuthProviders([])).toEqual([]);
  });

  it('keeps Google when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set (true for this test env)', () => {
    // The project .env defines NEXT_PUBLIC_GOOGLE_CLIENT_ID, so the build-time
    // constant `IS_GOOGLE_OAUTH_CONFIGURED` is true. We assert that — if env
    // changes upstream, this test flips and reminds us to revisit.
    expect(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID).toBeTruthy();
    const result = sortActiveAuthProviders([mkProvider('google'), mkProvider('email')]);
    expect(result.map(p => p.identifier)).toContain('google');
  });
});
