'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { JSX } from 'react';
import { useContext } from 'react';

import { logOutUser, useEmailAuthProviderMarker } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';

/**
 * LogoutMenuItem — "Logout" menu button: clears the session and navigates to home.
 *
 * @returns JSX of the logout menu button.
 */
const LogoutMenuItem = (): JSX.Element => {
  const { authenticate } = useContext(AuthContext);
  const router = useTransitionRouter();
  const emailProviderMarker = useEmailAuthProviderMarker();
  const t = useT();

  const handleLogout = async () => {
    try {
      await logOutUser({ marker: emailProviderMarker });
      authenticate();
      router.push('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error logging out:', error);
    }
  };

  return (
    <button
      className="group flex justify-start p-2 text-paper transition-colors duration-200 hover:text-brand"
      onClick={handleLogout}
    >
      <div>{t('logout_text', 'Logout')}</div>
    </button>
  );
};

export default LogoutMenuItem;
