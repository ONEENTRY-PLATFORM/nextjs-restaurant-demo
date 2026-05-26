'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { oauthLogIn, syncTokens } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { GOOGLE_OAUTH_MARKER_STORAGE_KEY } from '@/components/forms/authProviders';
import { peekPendingReservationResume } from '@/components/reservation/reservationOAuthResumeState';

/**
 * GoogleAuthCallbackInner — Google OAuth callback that exchanges `?code` for a OneEntry session
 * via {@link oauthLogIn}, stores the refresh token, signals {@link AuthContext} to re-fetch the user,
 * then redirects back to where the flow started.
 *
 * Return path resolution (first hit wins): `?return=` query → reservation resume `returnTo`
 * → `sessionStorage['google-oauth-return']` written by {@link startGoogleOAuth} → `'/'`.
 *
 * If the redirect was launched from the reservation popup ({@link ReservationAuthStep}),
 * `sessionStorage` also holds a resume snapshot and the popup is programmatically reopened via
 * {@link OpenDrawerContext} so the user sees their form values again — regardless of whether the
 * login succeeded or was cancelled.
 *
 * @returns JSX of the OAuth callback page (a "Signing you in…" placeholder while exchange runs).
 */
const GoogleAuthCallbackInner = (): JSX.Element => {
  const params = useSearchParams();
  const router = useRouter();
  const { authenticate } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const expectedState =
      typeof window !== 'undefined' ? sessionStorage.getItem('google-oauth-state') : null;
    const storedReturn =
      typeof window !== 'undefined' ? sessionStorage.getItem('google-oauth-return') : null;
    // Marker is written by `startGoogleOAuth(provider)` before the redirect. Falls back to
    // `'google'` defensively in case sessionStorage was cleared between redirect and callback.
    const storedMarker =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(GOOGLE_OAUTH_MARKER_STORAGE_KEY)
        : null;
    const providerMarker = storedMarker || 'google';
    const resume = peekPendingReservationResume();
    const returnTo = params.get('return') || resume?.returnTo || storedReturn || '/';

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('google-oauth-state');
      sessionStorage.removeItem('google-oauth-return');
      sessionStorage.removeItem(GOOGLE_OAUTH_MARKER_STORAGE_KEY);
    }

    const reopenReservationPopup = () => {
      if (!resume) return;
      setComponent('ReservationPopup');
      setOpen(true);
    };

    if (!code) {
      toast.error('Google sign-in was cancelled.');
      router.replace(returnTo);
      reopenReservationPopup();
      return;
    }
    if (!state || state !== expectedState) {
      toast.error('Google sign-in failed (state mismatch).');
      router.replace(returnTo);
      reopenReservationPopup();
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const toastId = toast.loading('Signing you in…');
    router.replace(returnTo);

    oauthLogIn({ marker: providerMarker, code, redirectUri }).then(res => {
      if (res?.error || !res?.data) {
        toast.update(toastId, {
          render: res?.error ?? 'Google sign-in failed.',
          type: 'error',
          isLoading: false,
          autoClose: 15000,
        });
        reopenReservationPopup();
        return;
      }
      localStorage.setItem('refresh-token', res.data.refreshToken);
      syncTokens(res.data.accessToken, res.data.refreshToken);
      authenticate();
      toast.update(toastId, {
        render: 'You signed in!',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      reopenReservationPopup();
    });
  }, [params, router, authenticate, setComponent, setOpen]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-black text-paper">
      Signing you in…
    </div>
  );
};

export default GoogleAuthCallbackInner;
