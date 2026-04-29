'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { Suspense, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { oauthLogIn } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';

/**
 * Google OAuth callback — exchanges the `?code` for a OneEntry session
 * via {@link oauthLogIn}, persists the refresh token, signals
 * {@link AuthContext} to re-fetch the user, then redirects back to where
 * the flow started (`?return=/cart`, defaults to `/`).
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

    const redirectUri = `${window.location.origin}/auth/callback/google`;
    oauthLogIn({ marker: 'google', code, redirectUri }).then((res) => {
      if (res?.error || !res?.data) {
        finish(false, res?.error ?? 'Google sign-in failed.');
        return;
      }
      localStorage.setItem('refresh-token', res.data.refreshToken);
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

const GoogleAuthCallback = (): JSX.Element => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-paper">
        Signing you in…
      </div>
    }
  >
    <GoogleAuthCallbackInner />
  </Suspense>
);

export default GoogleAuthCallback;
