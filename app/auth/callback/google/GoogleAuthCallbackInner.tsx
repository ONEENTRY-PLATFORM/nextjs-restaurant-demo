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
      typeof window !== 'undefined' ? sessionStorage.getItem('google-oauth-state') : null;
    const returnTo = params.get('return') || '/';

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('google-oauth-state');
    }

    if (!code) {
      toast.error('Google sign-in was cancelled.');
      router.replace(returnTo);
      return;
    }
    if (!state || state !== expectedState) {
      toast.error('Google sign-in failed (state mismatch).');
      router.replace(returnTo);
      return;
    }

    // Оптимистичный redirect: обмен code → token занимает 2-5 сек (наш Server
    // Action → OneEntry → Google → OneEntry). Юзер залипал бы на пустой
    // callback-странице. Уводим сразу на returnTo, обмен крутится в фоне —
    // syncTokens/authenticate/toast работают на root-уровне (AuthContext,
    // ToastContainer), поэтому корректно отрабатывают после смены маршрута.
    // Loading-toast подсказывает юзеру, что логин ещё идёт; промисы тоста
    // (.update) переводят его в success/error по результату.
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const toastId = toast.loading('Signing you in…');
    router.replace(returnTo);

    oauthLogIn({ marker: 'google', code, redirectUri }).then(res => {
      if (res?.error || !res?.data) {
        toast.update(toastId, {
          render: res?.error ?? 'Google sign-in failed.',
          type: 'error',
          isLoading: false,
          autoClose: 15000,
        });
        return;
      }
      localStorage.setItem('refresh-token', res.data.refreshToken);
      syncTokens(res.data.accessToken, res.data.refreshToken);
      authenticate();
      toast.update(toastId, {
        render: 'You signed in!',
        type: 'success',
        isLoading: false,
        autoClose: 15000,
      });
    });
  }, [params, router, authenticate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-paper">
      Signing you in…
    </div>
  );
};

export default GoogleAuthCallbackInner;
