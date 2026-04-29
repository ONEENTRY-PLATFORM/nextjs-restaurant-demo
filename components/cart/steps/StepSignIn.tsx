'use client';

import type { JSX } from 'react';
import { useContext, useEffect } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { setStep } from '@/app/store/reducers/OrderSlice';
import LoginEmailIcon from '@/components/icons/login-email.svg';
import LoginGoogleIcon from '@/components/icons/login-google.svg';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * Checkout step — auth gate.
 *
 * If the user is already authenticated, auto-advances to `address`.
 * Otherwise renders the provider chooser from `static-html/pk_login.html`
 * — restricted to two buttons (Email, Google) per current design.
 *
 * - Email opens the existing {@link SignInForm} drawer.
 * - Google performs a top-window redirect to Google's OAuth endpoint;
 *   the callback at `app/auth/callback/google/page.tsx` exchanges the
 *   code via {@link oauthLogIn} → `api.AuthProvider.oauth('google', …)`.
 * @returns {JSX.Element} Step JSX.
 */
const StepSignIn = (): JSX.Element => {
  const { isAuth, isLoading } = useContext(AuthContext);
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isAuth) {
      dispatch(setStep('address'));
    }
  }, [isAuth, dispatch]);

  if (isLoading) {
    return <div className="text-center text-paper/80">Loading...</div>;
  }

  const onEmailLogin = () => {
    setComponent('SignInForm');
    setOpen(true);
  };

  const onGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      // Fallback — Google credentials not configured yet (see ONEENTRY-ADMIN-SETUP.md).
      onEmailLogin();
      return;
    }
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
  };

  return (
    <div className="mx-auto flex w-full max-w-115 flex-col">
      <button type="button" onClick={onEmailLogin} className="cart_btn">
        <div className="flex w-50 items-center justify-start gap-5 font-bold text-base">
          <LoginEmailIcon />
          Login With Email
        </div>
      </button>
      <button type="button" onClick={onGoogleLogin} className="cart_btn">
        <div className="flex w-50 items-center justify-start gap-5 font-bold text-base">
          <LoginGoogleIcon />
          Login With Google
        </div>
      </button>
    </div>
  );
};

export default StepSignIn;
