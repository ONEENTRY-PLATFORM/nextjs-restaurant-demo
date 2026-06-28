'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import SignInPrompt from '@/components/forms/SignInPrompt';
import ProfileSections from '@/components/profile/ProfileSections';

/**
 * ProfilePageClient — client-side renderer for the profile data section (auth-gated).
 *
 * @returns JSX of the loading state, sign-in prompt, or the authenticated profile sections.
 */
const ProfilePageClient = (): JSX.Element => {
  const t = useT();
  const { isAuth, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="text-paper/80">{t('profile_loading_text', '')}</div>;
  }

  if (!isAuth) {
    return <SignInPrompt />;
  }

  return <ProfileSections />;
};

export default ProfilePageClient;
