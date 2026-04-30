'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import UserForm from '@/components/forms/UserForm';

const ProfilePageClient = ({
  dict,
}: {
  dict: IAttributeValues;
}): JSX.Element => {
  const { isAuth, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="text-paper/80">
        {dict.profile_loading_text?.value as string}
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        {dict.profile_signin_prompt?.value as string}
      </div>
    );
  }

  return <UserForm dict={dict} className="" />;
};

export default ProfilePageClient;
