import type { JSX, ReactNode } from 'react';

import ProfilePageHeader from '@/components/profile/ProfilePageHeader';

/**
 * ProfileLayout — обёртка маршрутов `/profile/**` с общим хедером.
 *
 * @param   {object}      props          - Пропсы layout-а.
 * @param   {ReactNode}   props.children - Контент вложенного маршрута.
 * @returns {JSX.Element}                JSX layout-а профиля.
 */
const ProfileLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <section className="section_layout pt-0">
      <ProfilePageHeader />
      {children}
    </section>
  );
};

export default ProfileLayout;
