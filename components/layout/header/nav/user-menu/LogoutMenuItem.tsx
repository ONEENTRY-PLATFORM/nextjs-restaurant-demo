'use client';

import { useTransitionRouter } from 'next-transition-router';
import type { JSX } from 'react';
import { useContext } from 'react';

import { logOutUser } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';

/**
 * LogoutMenuItem — "Logout" menu button: clears the session and navigates to home.
 *
 * @returns {JSX.Element} JSX of the logout menu button.
 */
const LogoutMenuItem = (): JSX.Element => {
  const { authenticate } = useContext(AuthContext);
  const router = useTransitionRouter();

  const handleLogout = async () => {
    try {
      await logOutUser({ marker: 'email' });
      authenticate();
      router.push('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error logging out:', error);
    }
  };

  return (
    <button
      className="group flex justify-start p-2 text-paper hover:text-brand"
      onClick={handleLogout}
    >
      <div>Logout</div>
    </button>
  );
};

export default LogoutMenuItem;
