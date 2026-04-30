'use client';

import type { JSX } from 'react';
import { useContext } from 'react';

import { AuthContext } from '@/app/store/providers/AuthContext';
import UserForm from '@/components/forms/UserForm';

export const dynamic = 'force-dynamic';

/**
 * Страница персональных данных профиля — рендерит {@link UserForm} для
 * залогиненного пользователя. Если пользователь не авторизован — показывает
 * приглашение войти.
 * @returns {JSX.Element} JSX страницы персональных данных.
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

  // UserForm ожидает проп dict; передаём пустой fallback — форма сама обработает.
  return <UserForm dict={{}} className="" />;
};

export default ProfilePage;
