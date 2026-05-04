'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { oauthLogIn, syncTokens } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';

/**
 * Google OAuth callback — обменивает `?code` на сессию OneEntry через
 * {@link oauthLogIn}, сохраняет refresh-токен, сигнализирует
 * {@link AuthContext} перезапросить данные пользователя, затем редиректит
 * туда, откуда начался флоу (`?return=/cart`, по умолчанию `/`).
 */
const GoogleAuthCallbackInner = (): JSX.Element => {
  const params = useSearchParams();
  const router = useRouter();
  const { authenticate } = useContext(AuthContext);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const expectedState =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('google-oauth-state')
        : null;
    const returnTo = params.get('return') || '/';

    const finish = (ok: boolean, message?: string) => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google-oauth-state');
      }
      if (!ok && message) toast.error(message);
      router.replace(returnTo);
    };

    if (!code) {
      finish(false, 'Google sign-in was cancelled.');
      return;
    }
    if (!state || state !== expectedState) {
      finish(false, 'Google sign-in failed (state mismatch).');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    oauthLogIn({ marker: 'google', code, redirectUri }).then((res) => {
      if (res?.error || !res?.data) {
        finish(false, res?.error ?? 'Google sign-in failed.');
        return;
      }
      localStorage.setItem('refresh-token', res.data.refreshToken);
      syncTokens(res.data.accessToken, res.data.refreshToken);
      authenticate();
      toast('You signed in!');
      finish(true);
    });
  }, [params, router, authenticate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-paper">
      Signing you in…
    </div>
  );
};

export default GoogleAuthCallbackInner;
