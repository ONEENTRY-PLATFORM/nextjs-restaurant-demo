'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import UserForm from '@/components/forms/UserForm';

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

  return <UserForm />;
};

export default ProfilePageClient;
