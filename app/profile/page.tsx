'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import UserForm from '@/components/forms/UserForm';

export const dynamic = 'force-dynamic';

/**
 * Profile personal-data page — renders {@link UserForm} for the logged-in
 * user. Shows a sign-in prompt if the user is not authenticated.
 * @returns {JSX.Element} Personal page JSX.
 */
const ProfilePage = (): JSX.Element => {
  const { isAuth, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="text-paper/80">Loading...</div>;
  }

  if (!isAuth) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        Please sign in to view your profile.
      </div>
    );
  }

  // UserForm expects a dict prop; pass empty fallback — the form handles it.
  return <UserForm dict={{}} className="" />;
};

export default ProfilePage;
