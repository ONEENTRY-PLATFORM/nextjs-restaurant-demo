import type { JSX } from 'react';

import { getDictionary } from '@/app/dictionaries';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * Страница персональных данных профиля — серверная обёртка, подгружает словарь
 * `static_content` и передаёт его клиентскому контенту, который сам решает,
 * что показать в зависимости от auth-состояния.
 * @returns {Promise<JSX.Element>} JSX страницы персональных данных.
 */
const ProfilePage = async (): Promise<JSX.Element> => {
  const dict = await getDictionary();
  return <ProfilePageClient dict={dict} />;
};

export default ProfilePage;
