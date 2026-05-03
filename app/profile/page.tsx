import type { JSX } from 'react';

import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

/**
 * Страница персональных данных профиля — серверная обёртка для клиентского
 * компонента, который сам читает `static_content` через `useT()` и решает,
 * что показать в зависимости от auth-состояния.
 * @returns {Promise<JSX.Element>} JSX страницы персональных данных.
 */
const ProfilePage = async (): Promise<JSX.Element> => {
  return <ProfilePageClient />;
};

export default ProfilePage;
