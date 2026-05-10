'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import ProfileSections from '@/components/profile/ProfileSections';

/**
 * ProfilePageClient — client-side renderer for the profile data section (auth-gated).
 *
 * @returns {JSX.Element} JSX of the loading state, sign-in prompt, or the authenticated profile sections.
 */
const ProfilePageClient = (): JSX.Element => {
  const t = useT();
  const { isAuth, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="text-paper/80">{t('profile_loading_text', '')}</div>;
  }

  if (!isAuth) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        {t('profile_signin_prompt', '')}
      </div>
    );
  }

  return <ProfileSections />;
};

export default ProfilePageClient;
